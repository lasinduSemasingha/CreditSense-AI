from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date

class CustomerInfo(BaseModel):
    name: str = Field(..., description="Customer full name")
    customerId: str = Field(..., description="Customer ID")
    photo: Optional[str] = Field(None, description="Photo URL")
    branch: str = Field("Main", description="Branch location")
    status: str = Field("Active", description="Customer status")
    equipmentType: str = Field("", description="Type of equipment leased")
    schemeType: str = Field("", description="Leasing scheme type")
    rentalPaymentType: str = Field("", description="Rental payment type")
    grantedDate: str = Field(..., description="Loan grant date")
    occupation: str = Field("", description="Customer occupation")
    monthlyIncome: float = Field(0.0, description="Monthly income in USD")
    maritalStatus: str = Field("Single", description="Marital status")
    dependents: int = Field(0, description="Number of dependents")
    Age: float = Field(0.0, description="Customer age")

class FinancialData(BaseModel):
    # Financial Attributes
    FacilityAmount: float = Field(0.0, description="Total facility amount")
    Tenor: float = Field(0.0, description="Loan tenor in months")
    EffectiveRate: float = Field(0.0, description="Effective interest rate")
    FlatRate: float = Field(0.0, description="Flat interest rate")
    NetRental: float = Field(0.0, description="Net rental amount")
    DownPayment: float = Field(0.0, description="Down payment amount")
    
    # Arrears Information
    NoOfRentalInArrears: float = Field(0.0, description="Number of rentals in arrears")
    ArrearsCapital: float = Field(0.0, description="Capital amount in arrears")
    ArrearsInterest: float = Field(0.0, description="Interest amount in arrears")
    ArrearsVat: float = Field(0.0, description="VAT amount in arrears")
    ArrearsOD: float = Field(0.0, description="OD amount in arrears")
    
    # Additional
    LastReceiptPaidAmount: float = Field(0.0, description="Last receipt paid amount")
    Prepayment: float = Field(0.0, description="Prepayment amount")
    
    # Derived features (will be calculated)
    arrears_intensity: Optional[float] = None
    debt_to_income_ratio: Optional[float] = None
    payment_coverage: Optional[float] = None
    arrears_ratio: Optional[float] = None
    overdue_intensity: Optional[float] = None
    payment_regularity: Optional[float] = None
    has_arrears: Optional[int] = None
    high_interest_flag: Optional[int] = None
    early_settlement: Optional[int] = None
    equipment_risk_score: Optional[float] = None
    branch_encoded: Optional[int] = None
    scheme_encoded: Optional[int] = None
    loan_age: Optional[float] = None
    tenor_to_age_ratio: Optional[float] = None

class BehavioralData(BaseModel):
    onTimePaymentPercentage: float = Field(0.0, description="Percentage of on-time payments")
    latePaymentFrequency: float = Field(0.0, description="Frequency of late payments")
    gracePeriodUsage: float = Field(0.0, description="Times grace period used")
    customerResponsiveness: float = Field(3.0, description="Customer responsiveness score (1-5)")
    complaintFrequency: float = Field(0.0, description="Complaint frequency")
    relationshipDuration: float = Field(0.0, description="Relationship duration in months")
    savingsRate: float = Field(0.0, description="Savings rate percentage")
    creditUtilization: float = Field(0.0, description="Credit utilization percentage")
    previousDefaults: float = Field(0.0, description="Number of previous defaults")
    partialPayments: float = Field(0.0, description="Number of partial payments")
    paymentReschedules: float = Field(0.0, description="Number of payment reschedules")
    earlySettlementHistory: bool = Field(False, description="Early settlement history")
    employmentStability: float = Field(3.0, description="Employment stability score (1-5)")
    addressStability: float = Field(3.0, description="Address stability score (1-5)")
    referenceChecks: float = Field(3.0, description="Reference checks score (1-5)")

class PredictionRequest(BaseModel):
    customer_info: CustomerInfo
    financial_data: FinancialData
    behavioral_data: BehavioralData

class FeatureImportance(BaseModel):
    feature: str
    importance: float
    impact: str
    contribution: float
    value: Any

class PredictionResponse(BaseModel):
    pd: float
    risk_category: str
    confidence: float
    timestamp: str
    top_features: List[FeatureImportance]
    recommendations: List[str]
    model_info: Dict[str, Any]
    feature_contributions: List[FeatureImportance]
    model_used: str
    model_performance: Dict[str, float]

class ModelComparison(BaseModel):
    model: str
    pd: float
    risk_category: str
    confidence: float
    performance: Dict[str, float]