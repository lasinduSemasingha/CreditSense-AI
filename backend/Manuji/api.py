from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
import joblib
import pandas as pd
import numpy as np
from glob import glob
import io
import os
import tempfile
from datetime import datetime
from pydantic import BaseModel, Field

predictor = None


class BranchInput(BaseModel):
    Branch: Optional[Any] = Field(..., description="Branch identifier (string or encoded int)")
    Facility_Type: Optional[str] = Field(..., alias='Facility Type', description="Facility type (e.g., lease)")
    FacilityAmount: Optional[float] = Field(..., description="Facility amount")
    Effective_Rate: Optional[float] = Field(..., alias='Effective Rate', description="Effective interest rate")
    No_of_Rental_in_arrears: Optional[int] = Field(..., alias='No of Rental in arrears', description="Number of rentals in arrears")
    Age: Optional[int] = Field(..., description="Account age in months")
    ArrearsCapital: Optional[float] = Field(0.0, description="Arrears capital")
    ArrearsInterest: Optional[float] = Field(0.0, description="Arrears interest")
    ArrearsVat: Optional[float] = Field(0.0, description="Arrears VAT")
    ArrearsOD: Optional[float] = Field(0.0, description="Arrears overdraft")
    FutureCapital: Optional[float] = Field(0.0, description="Future capital")
    FutureInterest: Optional[float] = Field(0.0, description="Future interest")
    NET_OUTSTANDING: Optional[float] = Field(..., alias='NET-OUTSTANDING', description="Net outstanding amount")
    Status: Optional[str] = Field(..., description="Status (e.g., Activated / Not Printed, Current Running, etc.)")
    NPLStatus: Optional[str] = Field(..., description="NPL Status: 'N' for Non-performing, 'P' for Performing")
    Last_Receipt_Paid_Amount: Optional[float] = Field(0.0, alias='Last Receipt Paid Amount', description="Last receipt paid amount")
    CD_Collection_Rental: Optional[float] = Field(0.0, alias='CD_Collection_Rental', description="Current day collection")
    ClaimablePercentage: Optional[float] = Field(100.0, description="Claimable percentage")
    Arrears_Ratio: Optional[float] = Field(None, description="Arrears ratio (optional). If omitted, computed from ArrearsCapital and ArrearsInterest")

    class Config:
        allow_population_by_field_name = True


class BatchBranchRequest(BaseModel):
    data: List[BranchInput]



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load latest model package at startup."""
    global predictor
    try:
        model_files = glob('models/all_models_package_*.pkl')
        if not model_files:
            print("⚠️ No model package found in models/. Start by running the training script.")
            predictor = None
        else:
            latest = max(model_files)
            package = joblib.load(latest)
            predictor = {
                'models': package.get('models', {}),
                'scaler': package.get('scaler'),
                'feature_columns': package.get('feature_columns', []),
                'best_model_name': package.get('best_model_name'),
                'encoders': package.get('encoders', {}),
                'target_label_encoder': package.get('target_label_encoder', None),
                'timestamp': package.get('timestamp')
            }
            print(f"✅ Loaded model package: {latest}")
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        predictor = None

    yield


app = FastAPI(
    title="Branch Performance Prediction API (Light)",
    description="Lightweight API that loads latest trained model package and serves predictions",
    version="1.0.0",
    lifespan=lifespan
)


def _normalize(name: str) -> str:
    return ''.join(ch for ch in str(name).lower() if ch.isalnum())


def prepare_input(df: pd.DataFrame) -> pd.DataFrame:
    """Prepare input DataFrame to match predictor['feature_columns'].
    Supports raw columns (e.g. 'Status', 'NPLStatus') if encoders are present.
    Raises Exception if required features cannot be fulfilled.
    """
    global predictor
    if predictor is None:
        raise Exception("Models not loaded")

    expected = list(predictor['feature_columns'])
    encoders = predictor.get('encoders', {}) or {}

    # Work on a copy
    df_work = df.copy()

    # For each expected column try to produce it
    produced = {}

    for col in expected:
        if col in df_work.columns:
            produced[col] = df_work[col]
            continue

        # handle encoded columns: e.g. 'Status_encoded' -> source 'Status'
        if col.endswith('_encoded'):
            src = col.replace('_encoded', '')
            if src in df_work.columns:
                # handle NPLStatus mapping (likely saved as dict)
                if src == 'NPLStatus' and isinstance(encoders.get('NPLStatus'), dict):
                    mapping = encoders['NPLStatus'].get('mapping', {})
                    produced[col] = df_work[src].astype(str).str.upper().map(mapping).fillna(0).astype(int)
                else:
                    enc = encoders.get(src)
                    if enc is not None and hasattr(enc, 'classes_'):
                        # safe transform: map known classes to their indices,
                        # unknown values fallback to index 0 (most-common fallback)
                        classes = list(enc.classes_)
                        mapping = {str(c): i for i, c in enumerate(classes)}
                        produced[col] = df_work[src].astype(str).map(mapping).fillna(0).astype(int)
                    else:
                        # try normalization match
                        # if column already present under variant
                        variants = [src.replace(' ', '_'), src.replace('_', ' '), src.replace(' ', '')]
                        found = None
                        for v in variants:
                            if v in df_work.columns:
                                found = v
                                break
                        if found:
                            produced[col] = df_work[found]
                        else:
                            # fallback: try to match normalized column names
                            target_norm = _normalize(src)
                            for c in df_work.columns:
                                if _normalize(c) == target_norm:
                                    produced[col] = df_work[c]
                                    found = c
                                    break
                            if found is None:
                                produced[col] = None
            else:
                produced[col] = None
            continue

        # Try flexible name matches for numeric/other columns
        # exact variants
        variants = [col.replace('_', ' '), col.replace('_', '-'), col.replace(' ', '_'), col.replace('-', '_')]
        found = None
        for v in variants:
            if v in df_work.columns:
                produced[col] = df_work[v]
                found = v
                break
        if found:
            continue

        # try normalized match
        target_norm = _normalize(col)
        for c in df_work.columns:
            if _normalize(c) == target_norm:
                produced[col] = df_work[c]
                found = c
                break
        if found:
            continue

        # last resort: try to find a column that contains the token words
        tokens = ''.join(ch if ch.isalnum() else ' ' for ch in col).split()
        for c in df_work.columns:
            cnorm = c.lower()
            if all(t.lower() in cnorm for t in tokens if len(t) > 2):
                produced[col] = df_work[c]
                found = c
                break
        # Special-case: compute Arrears_Ratio if missing
        if not found and produced.get(col) is None:
            if col == 'Arrears_Ratio':
                def _find(name):
                    # try common variants
                    for v in (name, name.replace('_', ' '), name.replace('_', '-'), name.replace(' ', '_')):
                        if v in df_work.columns:
                            return v
                    # normalized match
                    tnorm = _normalize(name)
                    for c in df_work.columns:
                        if _normalize(c) == tnorm:
                            return c
                    # token contains
                    tokens_local = ''.join(ch if ch.isalnum() else ' ' for ch in name).split()
                    for c in df_work.columns:
                        cnorm = c.lower()
                        if all(t.lower() in cnorm for t in tokens_local if len(t) > 2):
                            return c
                    return None

                cap_col = _find('ArrearsCapital') or _find('Arrears Capital')
                int_col = _find('ArrearsInterest') or _find('Arrears Interest')
                fac_col = _find('FacilityAmount') or _find('Facility Amount')

                cap_series = df_work[cap_col] if cap_col in df_work.columns else pd.Series([0] * len(df_work), index=df_work.index)
                int_series = df_work[int_col] if int_col in df_work.columns else pd.Series([0] * len(df_work), index=df_work.index)
                fac_series = df_work[fac_col] if fac_col in df_work.columns else pd.Series([0] * len(df_work), index=df_work.index)

                try:
                    produced[col] = (cap_series.fillna(0) + int_series.fillna(0)) / (fac_series.fillna(0) + 1)
                except Exception:
                    produced[col] = pd.Series([0] * len(df_work), index=df_work.index)
                found = True
            else:
                raise Exception(f"Missing required input column for prediction: '{col}'")

    # Build final DataFrame
    # If Arrears_Ratio is expected but not produced, compute from available fields
    if 'Arrears_Ratio' in expected and (produced.get('Arrears_Ratio') is None):
        def _find_col(name):
            # try exact
            if name in df_work.columns:
                return name
            # variants
            for v in [name.replace('_', ' '), name.replace('_', '-'), name.replace(' ', '_')]:
                if v in df_work.columns:
                    return v
            # normalized
            tnorm = _normalize(name)
            for c in df_work.columns:
                if _normalize(c) == tnorm:
                    return c
            # token contains
            tokens = ''.join(ch if ch.isalnum() else ' ' for ch in name).split()
            for c in df_work.columns:
                cnorm = c.lower()
                if all(t.lower() in cnorm for t in tokens if len(t) > 2):
                    return c
            return None

        cap_col = _find_col('ArrearsCapital') or _find_col('Arrears Capital')
        int_col = _find_col('ArrearsInterest') or _find_col('Arrears Interest')
        fac_col = _find_col('FacilityAmount') or _find_col('Facility Amount')

        cap_series = df_work[cap_col] if cap_col in df_work.columns else 0
        int_series = df_work[int_col] if int_col in df_work.columns else 0
        fac_series = df_work[fac_col] if fac_col in df_work.columns else 0

        try:
            ratio = (cap_series.fillna(0) + int_series.fillna(0)) / (fac_series.fillna(0) + 1)
        except Exception:
            ratio = pd.Series([0] * len(df_work), index=df_work.index)

        produced['Arrears_Ratio'] = ratio

    final_df = pd.DataFrame({k: (v if isinstance(v, pd.Series) else pd.Series(v, index=df_work.index)) for k, v in produced.items()})
    return final_df[expected]


@app.get('/', tags=['General'])
async def root():
    return {"message": "Branch Performance Prediction API (Light)", "status": "active", "docs": "/docs"}


@app.get('/health', tags=['General'])
async def health():
    loaded = predictor is not None
    return {"status": "healthy" if loaded else "no_models", "models_loaded": loaded, "timestamp": datetime.now().isoformat()}


@app.post('/predict', tags=['Prediction'])
async def predict_single(payload: BranchInput, model_name: Optional[str] = None):
    """Accepts a single JSON object with feature values and returns prediction."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Run training script first.")

    try:
        # use aliases so field names match original data columns (e.g. 'Facility Type')
        df = pd.DataFrame([payload.dict(by_alias=True)])
        X = prepare_input(df)
        X_scaled = predictor['scaler'].transform(X)

        if model_name is None:
            model_name = predictor['best_model_name']
        model = predictor['models'].get(model_name)
        if model is None:
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' not available")

        pred_num = int(model.predict(X_scaled)[0])
        if predictor.get('target_label_encoder') is not None and hasattr(predictor['target_label_encoder'], 'inverse_transform'):
            pred_label = predictor['target_label_encoder'].inverse_transform([pred_num])[0]
        else:
            pred_label = 'Good' if pred_num == 0 else 'Poor'

        confidence = None
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(X_scaled)[0]
            confidence = float(max(proba))

        return {"prediction": pred_label, "confidence": confidence, "model_used": model_name}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")


@app.post('/predict/batch', tags=['Prediction'])
async def predict_batch(payload: BatchBranchRequest, model_name: Optional[str] = None):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Run training script first.")
    try:
        # build DataFrame from Pydantic models using aliases
        df = pd.DataFrame([item.dict(by_alias=True) for item in payload.data])
        X = prepare_input(df)
        X_scaled = predictor['scaler'].transform(X)

        if model_name is None:
            model_name = predictor['best_model_name']
        model = predictor['models'].get(model_name)
        if model is None:
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' not available")

        preds = model.predict(X_scaled)
        results = []
        for i, p in enumerate(preds):
            pnum = int(p)
            if predictor.get('target_label_encoder') is not None and hasattr(predictor['target_label_encoder'], 'inverse_transform'):
                plabel = predictor['target_label_encoder'].inverse_transform([pnum])[0]
            else:
                plabel = 'Good' if pnum == 0 else 'Poor'

            conf = None
            if hasattr(model, 'predict_proba'):
                conf = float(max(model.predict_proba(X_scaled[i:i+1])[0]))

            results.append({"record_id": i, "prediction": plabel, "confidence": conf})

        return {"predictions": results, "total_records": len(results), "model_used": model_name}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {e}")


@app.post('/predict/upload', tags=['Prediction'])
async def predict_from_file(file: UploadFile = File(...), model_name: Optional[str] = None):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Run training script first.")
    try:
        contents = await file.read()
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="File must be CSV or Excel")

        X = prepare_input(df)
        X_scaled = predictor['scaler'].transform(X)

        if model_name is None:
            model_name = predictor['best_model_name']
        model = predictor['models'].get(model_name)
        if model is None:
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' not available")

        preds = model.predict(X_scaled)
        labels = []
        confs = []
        for i, p in enumerate(preds):
            pnum = int(p)
            if predictor.get('target_label_encoder') is not None and hasattr(predictor['target_label_encoder'], 'inverse_transform'):
                plabel = predictor['target_label_encoder'].inverse_transform([pnum])[0]
            else:
                plabel = 'Good' if pnum == 0 else 'Poor'
            labels.append(plabel)

        df_out = df.copy()
        df_out['Prediction'] = labels

        if hasattr(model, 'predict_proba'):
            probas = model.predict_proba(X_scaled)
            df_out['Confidence'] = [float(max(p)) for p in probas]

        out_dir = tempfile.gettempdir()
        out_name = f"predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        out_path = os.path.join(out_dir, out_name)
        df_out.to_excel(out_path, index=False)

        return FileResponse(out_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename=out_name)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {e}")


@app.get('/model/info', tags=['Model'])
async def model_info():
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    return {
        'available_models': list(predictor['models'].keys()),
        'best_model': predictor.get('best_model_name'),
        'feature_columns': predictor.get('feature_columns'),
        'timestamp': predictor.get('timestamp')
    }

@app.get('/model/feature_importance', tags=['Model'])
async def feature_importance(model_name: Optional[str] = None):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    if model_name is None:
        model_name = predictor['best_model_name']
    
    model = predictor['models'].get(model_name)
    
    if hasattr(model, 'feature_importances_'):
        importances = dict(zip(
            predictor['feature_columns'], 
            model.feature_importances_
        ))
        return sorted(importances.items(), key=lambda x: x[1], reverse=True)