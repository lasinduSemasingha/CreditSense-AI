import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any

def calculate_derived_features(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate derived features from input data"""
    
    # Extract relevant fields
    facility_amount = data.get('FacilityAmount', 0)
    net_rental = data.get('NetRental', 0)
    arrears_capital = data.get('ArrearsCapital', 0)
    arrears_interest = data.get('ArrearsInterest', 0)
    arrears_vat = data.get('ArrearsVat', 0)
    arrears_od = data.get('ArrearsOD', 0)
    no_of_rental_in_arrears = data.get('NoOfRentalInArrears', 0)
    age = data.get('Age', 0)
    tenor = data.get('Tenor', 0)
    effective_rate = data.get('EffectiveRate', 0)
    prepayment = data.get('Prepayment', 0)
    on_time_payment_percentage = data.get('onTimePaymentPercentage', 0)
    monthly_income = data.get('monthlyIncome', net_rental * 3)
    
    # Calculate total arrears
    total_arrears = arrears_capital + arrears_interest + arrears_vat + arrears_od
    
    # Derived features calculations
    arrears_intensity = total_arrears / facility_amount if facility_amount > 0 else 0
    debt_to_income_ratio = (facility_amount / (tenor or 1)) / monthly_income if monthly_income > 0 else 0
    payment_coverage = facility_amount / (net_rental * (tenor or 1)) if net_rental * (tenor or 1) > 0 else 0
    arrears_ratio = total_arrears / facility_amount if facility_amount > 0 else 0
    overdue_intensity = no_of_rental_in_arrears / tenor if tenor > 0 else 0
    payment_regularity = on_time_payment_percentage / 100
    has_arrears = 1 if total_arrears > 0 else 0
    high_interest_flag = 1 if effective_rate > 10 else 0
    early_settlement = 1 if prepayment > 0 or data.get('earlySettlementHistory', False) else 0
    
    # Calculate loan age from granted date
    try:
        granted_date = datetime.strptime(data.get('grantedDate', '2023-01-01'), '%Y-%m-%d')
        today = datetime.now()
        loan_age_months = (today.year - granted_date.year) * 12 + (today.month - granted_date.month)
    except:
        loan_age_months = 12
    
    tenor_to_age_ratio = tenor / age if age > 0 else 0
    
    # Calculate equipment risk score
    equipment_type = data.get('equipmentType', '')
    equipment_risk_score = calculate_equipment_risk_score(equipment_type)
    
    # Encode branch
    branch = data.get('branch', '')
    branch_encoded = encode_branch(branch)
    
    # Encode scheme
    scheme_type = data.get('schemeType', '')
    scheme_encoded = encode_scheme(scheme_type)
    
    # Add calculated features to data
    data.update({
        'arrears_intensity': float(arrears_intensity),
        'debt_to_income_ratio': float(debt_to_income_ratio),
        'payment_coverage': float(payment_coverage),
        'arrears_ratio': float(arrears_ratio),
        'overdue_intensity': float(overdue_intensity),
        'payment_regularity': float(payment_regularity),
        'has_arrears': int(has_arrears),
        'high_interest_flag': int(high_interest_flag),
        'early_settlement': int(early_settlement),
        'equipment_risk_score': float(equipment_risk_score),
        'branch_encoded': int(branch_encoded),
        'scheme_encoded': int(scheme_encoded),
        'loan_age': float(loan_age_months),
        'tenor_to_age_ratio': float(tenor_to_age_ratio)
    })
    
    return data

def calculate_equipment_risk_score(equipment_type: str) -> float:
    """Calculate risk score based on equipment type"""
    risk_scores = {
        'MOTOR CYCLES': 0.6,
        'MOTOR CARS': 0.5,
        'THREE WHEELERS': 0.7,
        'DUAL PURPOSE VEHICLES': 0.5,
        'LORRY': 0.7,
        'VAN': 0.6,
        'Mini Truck': 0.65,
        'BUSES': 0.6,
        'Single Cab': 0.6,
        'Agriculture Equipment': 0.5,
        'LAND VEHICLE TRACTORS': 0.5,
        # Legacy equipment types (for backward compatibility)
        'Construction': 0.8,
        'Medical': 0.3,
        'Office': 0.4,
        'Manufacturing': 0.7,
        'Transport': 0.6,
        'Agricultural': 0.5,
    }
    return risk_scores.get(equipment_type, 0.5)

def encode_branch(branch: str) -> int:
    """Encode branch name to numeric value"""
    branch_encoding = {
        'GODAGAMA': 1,
        'ANURADHAPURA': 2,
        'HYDE PARK': 3,
        'KANDY': 4,
        'HEAD OFFICE': 5,
        'MATARA': 6,
        'BADULLA': 7,
        'WELLAWATHE': 8,
        'NARAMMALA': 9,
        'MULLAITIVU': 10,
        'MINUWANGODA': 11,
        # Legacy branch names (for backward compatibility)
        'Main': 1,
        'North': 2,
        'South': 3,
        'East': 4,
        'West': 5,
        'Central': 6,
        'HQ': 7
    }
    return branch_encoding.get(branch, 0)

def encode_scheme(scheme: str) -> int:
    """Encode scheme type to numeric value"""
    scheme_encoding = {
        'NORMAL': 1,
        'STEP-UP': 2,
        # Legacy scheme types (for backward compatibility)
        'Standard Lease': 1,
        'Finance Lease': 2,
        'Operating Lease': 3,
        'Sale and Leaseback': 4,
        'Hire Purchase': 5,
        'Consumer Lease': 6
    }
    return scheme_encoding.get(scheme, 0)