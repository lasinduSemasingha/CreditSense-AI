from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np

# ── Load encoders, scaler, base models and hybrid weights ──────────────────
le_branch = joblib.load('models/le_branch.pkl')
le_gender  = joblib.load('models/le_gender.pkl')
scaler     = joblib.load('models/scaler.pkl')

rf_model  = joblib.load('models/randomforest_performance_score.pkl')
xgb_model = joblib.load('models/xgboost_performance_score.pkl')
cat_model = joblib.load('models/catboost_performance_score.pkl')

hybrid_weights = joblib.load('models/hybrid_weights_performance_score.pkl')
# hybrid_weights = {'RandomForest': w1, 'XGBoost': w2, 'CatBoost': w3}

FEATURES = [
    'Branch_Encoded', 'Gender_Encoded', 'Age', 'Years_At_Company',
    'Monthly_Salary', 'average_Work_Hours_Per_Week',
    'Overtime_Hours', 'Sick_Days', 'Employee_Satisfaction_Score'
]


# ── Pydantic schemas ───────────────────────────────────────────────────────
class EmployeeInput(BaseModel):
    Branch: str
    Gender: str
    Age: float
    Years_At_Company: float
    Monthly_Salary: float
    average_Work_Hours_Per_Week: float
    Overtime_Hours: float
    Sick_Days: float
    Employee_Satisfaction_Score: float


class BranchInput(BaseModel):
    employees: list[EmployeeInput]


# ── Helper ─────────────────────────────────────────────────────────────────
def build_feature_vector(emp: EmployeeInput) -> np.ndarray:
    """Encode → scale → return (1, n_features) array."""
    try:
        branch_enc  = le_branch.transform([emp.Branch])[0]
        gender_enc  = le_gender.transform([emp.Gender])[0]
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Unknown label: {e}")

    raw = np.array([[
        branch_enc, gender_enc,
        emp.Age, emp.Years_At_Company, emp.Monthly_Salary,
        emp.average_Work_Hours_Per_Week, emp.Overtime_Hours,
        emp.Sick_Days, emp.Employee_Satisfaction_Score
    ]])
    return scaler.transform(raw)


def hybrid_predict(X_scaled: np.ndarray) -> float:
    """Return R²-weighted blend prediction for a single row."""
    rf_pred  = rf_model.predict(X_scaled)[0]
    xgb_pred = xgb_model.predict(X_scaled)[0]
    cat_pred = cat_model.predict(X_scaled)[0]

    w = hybrid_weights
    return float(
        w['RandomForest'] * rf_pred +
        w['XGBoost']      * xgb_pred +
        w['CatBoost']     * cat_pred
    )


# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Branch Performance Hybrid API",
    description="Predicts employee Performance Score using an R²-weighted hybrid of RandomForest, XGBoost and CatBoost.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Branch Performance Hybrid Model API",
        "endpoints": ["/predict/employee", "/predict/branch"],
        "hybrid_weights": hybrid_weights,
    }


@app.post("/predict/employee")
def predict_employee(emp: EmployeeInput):
    """Predict Performance Score for a single employee."""
    X = build_feature_vector(emp)

    rf_pred  = float(rf_model.predict(X)[0])
    xgb_pred = float(xgb_model.predict(X)[0])
    cat_pred = float(cat_model.predict(X)[0])
    hybrid   = hybrid_predict(X)

    return {
        "performance_score": {
            "hybrid":        round(hybrid,   4),
            "random_forest": round(rf_pred,  4),
            "xgboost":       round(xgb_pred, 4),
            "catboost":      round(cat_pred, 4),
        },
        "hybrid_weights": hybrid_weights,
    }


@app.post("/predict/branch")
def predict_branch(payload: BranchInput):
    """Predict average Performance Score for all employees in a branch."""
    if not payload.employees:
        raise HTTPException(status_code=422, detail="employees list cannot be empty")

    scores = [hybrid_predict(build_feature_vector(emp)) for emp in payload.employees]

    return {
        "employee_count":           len(scores),
        "average_performance_score": round(float(np.mean(scores)),   4),
        "min_performance_score":     round(float(np.min(scores)),    4),
        "max_performance_score":     round(float(np.max(scores)),    4),
        "individual_scores":         [round(s, 4) for s in scores],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)