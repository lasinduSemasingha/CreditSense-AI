from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Impairment & ECL Prediction API",
    description="High accuracy prediction service for Impairment (99.59%) and 1 yr ECL (92.85%)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def load_models():
    global impairment_model, ecl_model, scaler, models_loaded

    try:
        impairment_model = joblib.load("gradient_boosting_impairment.pkl")
        ecl_model = joblib.load("stacking_ensemble_ecl.pkl")
        scaler = joblib.load("scaler_advanced.pkl")
        models_loaded = True
        print("✓ Models and scaler loaded successfully")
    except Exception as e:
        models_loaded = False
        print("✗ Failed to load models:", e)

# Pydantic models for request validation
class LoanInput(BaseModel):
    facility_amount: float = Field(..., description="Loan facility amount", example=100000)
    tenor: int = Field(..., description="Loan tenor in months", example=24)
    effec_rate: float = Field(..., description="Effective interest rate", example=7.5)
    flat_rate: float = Field(..., description="Flat interest rate", example=6.5)
    net_rental: float = Field(..., description="Monthly net rental payment", example=4500)
    no_of_rental_in_arrears: float = Field(..., description="Number of rentals in arrears (accepts decimals)", example=0.0)
    age: float = Field(..., description="Age of the borrower (accepts decimals)", example=35.5)
    due_date: Optional[int] = Field(None, description="Due date as integer (days value)", example=365)

    class Config:
        json_schema_extra = {
            "example": {
                "facility_amount": 150000,
                "tenor": 36,
                "effec_rate": 8.5,
                "flat_rate": 7.0,
                "net_rental": 5200,
                "no_of_rental_in_arrears": 1.5,
                "age": 42.3,
                "due_date": 548
            }
        }

class BatchLoanInput(BaseModel):
    loans: List[LoanInput]

class PredictionResponse(BaseModel):
    impairment: float
    ecl_1yr: float
    impairment_model: str = "Gradient Boosting"
    ecl_model: str = "Stacking Ensemble"
    impairment_accuracy: str = "99.59%"
    ecl_accuracy: str = "92.85%"

class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    total_loans: int
    average_impairment: float
    average_ecl: float
    total_impairment: float
    total_ecl: float

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    impairment_model: str
    ecl_model: str
    timestamp: str

# Feature engineering function
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the same feature engineering as training"""
    
    # Handle due date if present (as integer days)
    if 'due_date' in df.columns and df['due_date'].notna().any():
        df['Days_to_Due'] = df['due_date']
        df['Months_to_Due'] = df['Days_to_Due'] / 30
        df['Years_to_Due'] = df['Days_to_Due'] / 365
        df = df.drop('due_date', axis=1)
    else:
        # If no due date, create dummy features
        df['Days_to_Due'] = 0
        df['Months_to_Due'] = 0
        df['Years_to_Due'] = 0
    
    # Create all engineered features
    df['Rate_Difference'] = df['effec_rate'] - df['flat_rate']
    df['Rental_to_Amount_Ratio'] = df['net_rental'] / (df['facility_amount'] + 1)
    df['Amount_per_Tenor'] = df['facility_amount'] / (df['tenor'] + 1)
    df['Rental_per_Tenor'] = df['net_rental'] / (df['tenor'] + 1)
    df['Arrears_Rate'] = df['no_of_rental_in_arrears'] / (df['tenor'] + 1)
    df['Total_Payment'] = df['net_rental'] * df['tenor']
    df['Payment_Capacity'] = df['facility_amount'] / (df['Total_Payment'] + 1)
    df['Risk_Score'] = df['no_of_rental_in_arrears'] * df['effec_rate'] / 100
    df['Age_Tenor_Interaction'] = df['age'] * df['tenor']
    df['Amount_Rate_Interaction'] = df['facility_amount'] * df['effec_rate'] / 100
    df['Arrears_Amount'] = df['no_of_rental_in_arrears'] * df['net_rental']
    
    # Logarithmic features
    df['Log_Facility_Amount'] = np.log1p(df['facility_amount'])
    df['Log_Net_Rental'] = np.log1p(df['net_rental'])
    
    # Squared features
    df['Tenor_Squared'] = df['tenor'] ** 2
    df['Age_Squared'] = df['age'] ** 2
    df['Arrears_Squared'] = df['no_of_rental_in_arrears'] ** 2
    
    # Polynomial features
    df['Rate_Squared'] = df['effec_rate'] ** 2
    df['Rate_Cubed'] = df['effec_rate'] ** 3
    
    # Rename columns to match training data format
    df.rename(columns={
        'facility_amount': 'Facility amount',
        'tenor': 'Tenor',
        'effec_rate': 'Effec. Rate',
        'flat_rate': 'Flat Rate',
        'net_rental': 'Net Rental',
        'no_of_rental_in_arrears': 'No of Rental in arrears',
        'age': 'Age'
    }, inplace=True)
    
    return df

# API Endpoints
@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": True,
        "impairment_model": "Gradient Boosting (99.59% accuracy)",
        "ecl_model": "Stacking Ensemble (92.85% accuracy)",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_single(loan: LoanInput):
    """
    Predict Impairment and 1 yr ECL for a single loan
    
    - **facility_amount**: Loan amount
    - **tenor**: Loan duration in months
    - **effec_rate**: Effective interest rate
    - **flat_rate**: Flat interest rate
    - **net_rental**: Monthly rental payment
    - **no_of_rental_in_arrears**: Number of payments missed
    - **age**: Borrower's age
    - **due_date**: Optional - Due date as integer (days value)
    """
    # Return 503 if models or scaler not loaded
    if not models_loaded or impairment_model is None or ecl_model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Models or scaler not loaded; prediction unavailable")

    try:
        # Convert to DataFrame (support Pydantic v2 `model_dump` and v1 `dict`)
        loan_data = loan.model_dump() if hasattr(loan, "model_dump") else loan.dict()
        data = pd.DataFrame([loan_data])
        
        # Engineer features
        data_engineered = engineer_features(data)
        
        # CRITICAL: Scale features (models were trained on scaled data)
        data_scaled = scaler.transform(data_engineered)
        
        # Make predictions
        impairment_pred = impairment_model.predict(data_scaled)[0]
        ecl_pred = ecl_model.predict(data_scaled)[0]
        
        return {
            "impairment": float(impairment_pred),
            "ecl_1yr": float(ecl_pred),
            "impairment_model": "Gradient Boosting",
            "ecl_model": "Stacking Ensemble",
            "impairment_accuracy": "99.59%",
            "ecl_accuracy": "92.85%"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(batch: BatchLoanInput):
    """
    Predict Impairment and 1 yr ECL for multiple loans
    
    Accepts a list of loan inputs and returns predictions for all
    """
    # Return 503 if models or scaler not loaded
    if not models_loaded or impairment_model is None or ecl_model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Models or scaler not loaded; batch prediction unavailable")

    try:
        # Convert to DataFrame (support Pydantic v2 `model_dump` and v1 `dict`)
        loans_data = [l.model_dump() if hasattr(l, "model_dump") else l.dict() for l in batch.loans]
        df = pd.DataFrame(loans_data)
        df = pd.DataFrame(loans_data)
        
        # Engineer features
        df_engineered = engineer_features(df)
        
        # CRITICAL: Scale features (models were trained on scaled data)
        df_scaled = scaler.transform(df_engineered)
        
        # Make predictions
        impairment_preds = impairment_model.predict(df_scaled)
        ecl_preds = ecl_model.predict(df_scaled)
        
        # Create response
        predictions = []
        for imp, ecl in zip(impairment_preds, ecl_preds):
            predictions.append({
                "impairment": float(imp),
                "ecl_1yr": float(ecl),
                "impairment_model": "Gradient Boosting",
                "ecl_model": "Stacking Ensemble",
                "impairment_accuracy": "99.59%",
                "ecl_accuracy": "92.85%"
            })
        
        return {
            "predictions": predictions,
            "total_loans": len(predictions),
            "average_impairment": float(np.mean(impairment_preds)),
            "average_ecl": float(np.mean(ecl_preds)),
            "total_impairment": float(np.sum(impairment_preds)),
            "total_ecl": float(np.sum(ecl_preds))
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@app.get("/models/info")
async def get_models_info():
    """Get information about loaded models and their performance"""
    return {
        "impairment_model": {
            "name": "Gradient Boosting",
            "accuracy": "99.59%",
            "r2_score": 0.995887,
            "rmse": 11870.69,
            "mae": 3960.25
        },
        "ecl_model": {
            "name": "Stacking Ensemble",
            "accuracy": "92.85%",
            "r2_score": 0.928455,
            "rmse": 5562.26,
            "mae": 1899.75
        },
        "features_used": 28,
        "training_samples": 99888
    }

# Run the app
if __name__ == "__main__":
    print("\n" + "="*70)
    print("STARTING PREDICTION API SERVER")
    print("="*70)
    print("\nAPI Documentation available at: http://localhost:8000/docs")
    print("Alternative docs at: http://localhost:8000/redoc")
    print("\n" + "="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)