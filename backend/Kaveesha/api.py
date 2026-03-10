# ============================================================
# FastAPI Credit Default Risk Prediction API
# Model: Stacking Ensemble (CatBoost + RandomForest + XGBoost)
# ============================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

# Compatibility patch: if the model was pickled with a different sklearn version,
# LogisticRegression instances may be missing 'multi_class'. Setting it at the
# class level ensures it is always accessible regardless of what's in __dict__.
if not hasattr(LogisticRegression, "multi_class"):
    LogisticRegression.multi_class = "deprecated"

# --- Load the trained model at startup ---
MODEL_PATH = "stacking_default_risk_model.pkl"
try:
    model = joblib.load(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except FileNotFoundError:
    raise RuntimeError(f"Model file not found: {MODEL_PATH}")


# --- Pydantic schema for input validation ---
class CreditFeatures(BaseModel):
    FacilityAmount: float = Field(..., description="Total facility amount granted")
    Tenor: float = Field(..., description="Loan tenor in months")
    EffectiveRate: float = Field(..., alias="Effective Rate", description="Effective interest rate")
    FlatRate: float = Field(..., description="Flat interest rate")
    NetRental: float = Field(..., description="Net rental amount")
    DownPayment: float = Field(..., description="Down payment amount")
    NoOfRentalInArrears: float = Field(..., alias="No of Rental in arrears", description="Number of rentals in arrears")
    Age: float = Field(..., description="Age of the facility in months")
    ArrearsCapital: float = Field(..., description="Arrears capital amount")
    ArrearsInterest: float = Field(..., description="Arrears interest amount")
    ArrearsVat: float = Field(..., description="Arrears VAT amount")
    ArrearsOD: float = Field(..., description="Arrears OD amount")
    ArrearsOther: float = Field(..., description="Arrears other amount")
    ArrearsInsu: float = Field(..., description="Arrears insurance amount")
    ArrearsSundry: float = Field(..., description="Arrears sundry amount")
    Advance: float = Field(..., description="Advance amount")
    AdvanceRental: float = Field(..., description="Advance rental amount")
    AdvanceSundry: float = Field(..., description="Advance sundry amount")
    AdvanceOther: float = Field(..., description="Advance other amount")
    LastReceiptPaidAmount: float = Field(..., alias="Last Receipt Paid Amount", description="Last receipt paid amount")
    NetOutstanding: float = Field(..., alias="NET-OUTSTANDING", description="Net outstanding balance")
    ArrearsInsuEasyPay: float = Field(..., description="Arrears insurance easy pay")
    arrears_intensity: float = Field(..., description="Calculated arrears intensity score")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "FacilityAmount": 1500000.0,
                "Tenor": 48.0,
                "Effective Rate": 18.5,
                "FlatRate": 12.0,
                "NetRental": 45000.0,
                "DownPayment": 300000.0,
                "No of Rental in arrears": 3.0,
                "Age": 24.0,
                "ArrearsCapital": 120000.0,
                "ArrearsInterest": 15000.0,
                "ArrearsVat": 5000.0,
                "ArrearsOD": 2000.0,
                "ArrearsOther": 0.0,
                "ArrearsInsu": 3000.0,
                "ArrearsSundry": 0.0,
                "Advance": 0.0,
                "AdvanceRental": 0.0,
                "AdvanceSundry": 0.0,
                "AdvanceOther": 0.0,
                "Last Receipt Paid Amount": 45000.0,
                "NET-OUTSTANDING": 950000.0,
                "ArrearsInsuEasyPay": 0.0,
                "arrears_intensity": 0.65
            }
        }


# --- Pydantic schema for response ---
class PredictionResponse(BaseModel):
    probability_of_default: float = Field(..., description="Probability of default (0 to 1)")
    predicted_class: int = Field(..., description="Predicted class (0=Non-Default, 1=Default)")
    risk_category: str = Field(..., description="Risk category (Low Risk / Medium Risk / High Risk)")


# --- Initialize FastAPI ---
app = FastAPI(
    title="Credit Default Risk Prediction API",
    description="Predict the probability of default and risk category using a Stacking Ensemble model (CatBoost + RandomForest + XGBoost).",
    version="1.0.0"
)


@app.get("/")
def root():
    return {"message": "Credit Default Risk Prediction API is running."}


@app.get("/health")
def health_check():
    return {"status": "healthy", "model": "stacking_ensemble"}


@app.post("/predict", response_model=PredictionResponse)
def predict(features: CreditFeatures):
    try:
        # Build feature array in the correct column order
        feature_names = [
            "FacilityAmount", "Tenor", "Effective Rate", "FlatRate",
            "NetRental", "DownPayment", "No of Rental in arrears", "Age",
            "ArrearsCapital", "ArrearsInterest", "ArrearsVat", "ArrearsOD",
            "ArrearsOther", "ArrearsInsu", "ArrearsSundry", "Advance",
            "AdvanceRental", "AdvanceSundry", "AdvanceOther",
            "Last Receipt Paid Amount", "NET-OUTSTANDING",
            "ArrearsInsuEasyPay", "arrears_intensity"
        ]
        input_data = features.model_dump(by_alias=True)
        input_df = pd.DataFrame([input_data])
        input_df = input_df[feature_names]

        # Get prediction
        prob = model.predict_proba(input_df)[0, 1]
        pred_class = int(prob >= 0.5)

        # Risk classification
        if prob >= 0.80:
            risk = "High Risk"
        elif prob >= 0.20:
            risk = "Medium Risk"
        else:
            risk = "Low Risk"

        return PredictionResponse(
            probability_of_default=round(float(prob), 6),
            predicted_class=pred_class,
            risk_category=risk
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Run with: uvicorn api:app --host 0.0.0.0 --port 8000 --reload ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)