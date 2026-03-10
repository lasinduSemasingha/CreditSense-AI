"""
FastAPI — Impairment & 1-Year ECL Prediction Service
Uses only the two highest-accuracy models per target:
  Impairment : Random Forest (R²=99.12%)  |  LightGBM (R²=99.09%)
  1-Year ECL : Stacking Ensemble (R²=84.87%)  |  Random Forest (R²=84.48%)
Scaler: scaler_advanced.pkl
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd
import numpy as np
import joblib
import os


# ---------------------------------------------------------------------------
# Model registries — top-2 models per target selected by R² on the test set
#
# Impairment  →  Random Forest (R²=0.9912)  |  LightGBM (R²=0.9909)
# 1-Year ECL  →  Stacking Ensemble (R²=0.8487)  |  Random Forest (R²=0.8448)
# ---------------------------------------------------------------------------
_IMP_MODEL_REGISTRY = [
    ("Random Forest", "random_forest_impairment.pkl"),
    ("LightGBM",      "lightgbm_impairment.pkl"),
]

_ECL_MODEL_REGISTRY = [
    ("Stacking Ensemble", "stacking_ensemble_ecl.pkl"),
    ("Random Forest",     "random_forest_ecl.pkl"),
]

_artefacts: dict = {}


def _try_load(path: str):
    """Load a pkl if it exists, else return None."""
    return joblib.load(path) if os.path.exists(path) else None


@asynccontextmanager
async def lifespan(app: FastAPI):
    _artefacts["scaler"] = joblib.load("scaler_advanced.pkl")
    _artefacts["models_imp"] = {}   # name → model
    _artefacts["models_ecl"] = {}   # name → model

    for name, imp_file in _IMP_MODEL_REGISTRY:
        m = _try_load(imp_file)
        if m:
            _artefacts["models_imp"][name] = m
            print(f"  ✓ Loaded impairment model: {name}")
        else:
            print(f"  ⚠ Impairment model not found: {imp_file}")

    for name, ecl_file in _ECL_MODEL_REGISTRY:
        m = _try_load(ecl_file)
        if m:
            _artefacts["models_ecl"][name] = m
            print(f"  ✓ Loaded ECL model:        {name}")
        else:
            print(f"  ⚠ ECL model not found: {ecl_file}")

    print(f"\n✓ {len(_artefacts['models_imp'])} impairment models, "
          f"{len(_artefacts['models_ecl'])} ECL models loaded.")
    yield
    _artefacts.clear()


app = FastAPI(
    title="Impairment & 1-Year ECL Prediction API",
    description=(
        "Returns predictions for **Impairment** and **1-Year ECL** using the "
        "two highest-accuracy models per target, plus ensemble mean and confidence. "
        "Impairment: Random Forest (R²=99.12%) & LightGBM (R²=99.09%). "
        "1-Year ECL: Stacking Ensemble (R²=84.87%) & Random Forest (R²=84.48%)."
    ),
    version="3.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Input schema
# ---------------------------------------------------------------------------
class PredictionInput(BaseModel):
    effec_rate: float = Field(..., description="Effective interest rate (%)", example=12.5)
    flat_rate: float = Field(..., description="Flat interest rate (%)", example=7.2)
    net_rental: float = Field(..., description="Net rental payment amount", example=15000.0)
    facility_amount: float = Field(..., description="Total facility / loan amount", example=500000.0)
    tenor: int = Field(..., description="Tenor in whole months (integer)", example=36)
    no_of_rental_in_arrears: float = Field(..., description="Number of rental payments in arrears (decimal)", example=2.5)
    age: float = Field(..., description="Age of the borrower / asset in years (decimal)", example=35.4)
    due_date: Optional[int] = Field(None, description="Days remaining to due / maturity date (whole number)", example=480)

    model_config = {"json_schema_extra": {"examples": [
        {
            "effec_rate": 12.5,
            "flat_rate": 7.2,
            "net_rental": 15000.0,
            "facility_amount": 500000.0,
            "tenor": 36,
            "no_of_rental_in_arrears": 2.5,
            "age": 35.4,
            "due_date": 480,
        }
    ]}}


# ---------------------------------------------------------------------------
# Feature engineering (mirrors the training notebook)
# ---------------------------------------------------------------------------
def _engineer_features(inp: PredictionInput) -> pd.DataFrame:
    row = {
        "Effec. Rate": inp.effec_rate,
        "Flat Rate": inp.flat_rate,
        "Net Rental": inp.net_rental,
        "Facility amount": inp.facility_amount,
        "Tenor": inp.tenor,
        "No of Rental in arrears": inp.no_of_rental_in_arrears,
        "Age": inp.age,
    }
    df = pd.DataFrame([row])

    if inp.due_date is not None:
        days = int(inp.due_date)
        df["Days_to_Due"] = days
        df["Months_to_Due"] = days / 30
        df["Years_to_Due"] = days / 365

    df["Rate_Difference"] = df["Effec. Rate"] - df["Flat Rate"]
    df["Rental_to_Amount_Ratio"] = df["Net Rental"] / (df["Facility amount"] + 1)
    df["Amount_per_Tenor"] = df["Facility amount"] / (df["Tenor"] + 1)
    df["Rental_per_Tenor"] = df["Net Rental"] / (df["Tenor"] + 1)
    df["Arrears_Rate"] = df["No of Rental in arrears"] / (df["Tenor"] + 1)
    df["Total_Payment"] = df["Net Rental"] * df["Tenor"]
    df["Payment_Capacity"] = df["Facility amount"] / (df["Total_Payment"] + 1)
    df["Risk_Score"] = df["No of Rental in arrears"] * df["Effec. Rate"] / 100
    df["Age_Tenor_Interaction"] = df["Age"] * df["Tenor"]
    df["Amount_Rate_Interaction"] = df["Facility amount"] * df["Effec. Rate"] / 100
    df["Arrears_Amount"] = df["No of Rental in arrears"] * df["Net Rental"]
    df["Log_Facility_Amount"] = np.log1p(df["Facility amount"])
    df["Log_Net_Rental"] = np.log1p(df["Net Rental"])
    df["Tenor_Squared"] = df["Tenor"] ** 2
    df["Age_Squared"] = df["Age"] ** 2
    df["Arrears_Squared"] = df["No of Rental in arrears"] ** 2
    df["Rate_Squared"] = df["Effec. Rate"] ** 2
    df["Rate_Cubed"] = df["Effec. Rate"] ** 3

    return df


def _align_columns(df: pd.DataFrame, scaler) -> pd.DataFrame:
    if hasattr(scaler, "feature_names_in_"):
        expected = list(scaler.feature_names_in_)
        for col in expected:
            if col not in df.columns:
                df[col] = 0.0
        df = df[expected]
    return df


def _confidence(preds: np.ndarray) -> float:
    """Confidence % from coefficient of variation across multiple model predictions."""
    mean_val = float(np.mean(preds))
    cv = float(np.std(preds)) / (abs(mean_val) + 1e-10)
    return round(max(0.0, min(100.0, 100.0 * (1.0 - min(1.0, cv)))), 2)


def _run_all_models(model_dict: dict, X_scaled: np.ndarray) -> dict:
    """Return per-model predictions plus ensemble mean and confidence."""
    per_model = {}
    for name, model in model_dict.items():
        per_model[name] = round(float(model.predict(X_scaled)[0]), 4)

    values = np.array(list(per_model.values()))
    per_model["ensemble_mean"] = round(float(values.mean()), 4)
    per_model["confidence_pct"] = _confidence(values)
    return per_model


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {"message": "Impairment & 1-Year ECL Prediction API v2", "status": "running"}


@app.get("/health", tags=["Health"])
def health():
    imp_models = list(_artefacts.get("models_imp", {}).keys())
    ecl_models = list(_artefacts.get("models_ecl", {}).keys())
    return {
        "status": "healthy",
        "impairment_models": imp_models,
        "ecl_models": ecl_models,
    }


@app.post("/predict", tags=["Prediction"])
def predict(payload: PredictionInput):
    """
    Returns per-model **Impairment** and **1-Year ECL** predictions.

    Each target section contains one entry per loaded model plus:
    - `ensemble_mean` — average across all models
    - `confidence_pct` — inter-model agreement score (0–100%)
    """
    try:
        df = _engineer_features(payload)
        df = _align_columns(df, _artefacts["scaler"])
        X_scaled = _artefacts["scaler"].transform(df)

        return {
            "impairment": _run_all_models(_artefacts["models_imp"], X_scaled),
            "ecl_1yr":    _run_all_models(_artefacts["models_ecl"], X_scaled),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/predict/batch", tags=["Prediction"])
def predict_batch(records: list[PredictionInput]):
    """
    Batch predictions — accepts a JSON array and returns per-model predictions
    for every record in the same order.
    """
    if not records:
        raise HTTPException(status_code=400, detail="Request body must be a non-empty list.")
    if len(records) > 1000:
        raise HTTPException(status_code=400, detail="Batch size cannot exceed 1000 records.")

    try:
        frames = [_engineer_features(r) for r in records]
        df = pd.concat(frames, ignore_index=True)
        df = _align_columns(df, _artefacts["scaler"])
        X_scaled = _artefacts["scaler"].transform(df)

        # Build per-model prediction arrays
        imp_preds = {name: model.predict(X_scaled) for name, model in _artefacts["models_imp"].items()}
        ecl_preds = {name: model.predict(X_scaled) for name, model in _artefacts["models_ecl"].items()}

        results = []
        for i in range(len(records)):
            imp_vals = {name: round(float(arr[i]), 4) for name, arr in imp_preds.items()}
            ecl_vals = {name: round(float(arr[i]), 4) for name, arr in ecl_preds.items()}

            imp_arr = np.array(list(imp_vals.values()))
            ecl_arr = np.array(list(ecl_vals.values()))
            imp_vals["ensemble_mean"]  = round(float(imp_arr.mean()), 4)
            imp_vals["confidence_pct"] = _confidence(imp_arr)
            ecl_vals["ensemble_mean"]  = round(float(ecl_arr.mean()), 4)
            ecl_vals["confidence_pct"] = _confidence(ecl_arr)

            results.append({"impairment": imp_vals, "ecl_1yr": ecl_vals})

        return results
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
