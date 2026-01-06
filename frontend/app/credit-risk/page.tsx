"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/utils/auth-client"
import { 
  Calculator, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  User,
  DollarSign,
  Calendar,
  Activity,
  BarChart3,
  TrendingDown,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
  Lock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppHeader } from "@/components/app-header"

type CustomerInfo = {
  name: string
  customerId: string
  photo: string
  branch: string
  status: string
  equipmentType: string
  schemeType: string
  rentalPaymentType: string
  grantedDate: string
  occupation: string
  monthlyIncome: number
  maritalStatus: string
  dependents: number
  Age: number
}

type FinancialData = {
  FacilityAmount: number
  Tenor: number
  EffectiveRate: number
  FlatRate: number
  NetRental: number
  DownPayment: number
  NoOfRentalInArrears: number
  ArrearsCapital: number
  ArrearsInterest: number
  ArrearsVat: number
  ArrearsOD: number
  LastReceiptPaidAmount: number
  Prepayment: number
  arrears_intensity: number
  debt_to_income_ratio: number
  payment_coverage: number
  arrears_ratio: number
  overdue_intensity: number
  payment_regularity: number
  has_arrears: number
  high_interest_flag: number
  early_settlement: number
  equipment_risk_score: number
  branch_encoded: number
  scheme_encoded: number
  loan_age: number
  tenor_to_age_ratio: number
}

type BehavioralData = {
  onTimePaymentPercentage: number
  latePaymentFrequency: number
  gracePeriodUsage: number
  customerResponsiveness: number
  complaintFrequency: number
  relationshipDuration: number
  savingsRate: number
  creditUtilization: number
  previousDefaults: number
  partialPayments: number
  paymentReschedules: number
  earlySettlementHistory: boolean
  employmentStability: number
  addressStability: number
  referenceChecks: number
}

type FeatureContribution = {
  feature: string
  importance: number
  impact: string
  contribution: number
  value: number
}

type PredictionResponse = {
  pd: number
  risk_category: string
  confidence: number
  timestamp: string
  top_features: FeatureContribution[]
  recommendations: string[]
  model_info: {
    name: string
    version: string
    training_date: string
    features_used: number
    accuracy: number
    auc_score: number
  }
  feature_contributions: FeatureContribution[]
  model_used: string
  model_performance: {
    accuracy: number
    precision: number
    recall: number
    f1_score: number
    auc_score: number
  }
}

export default function CreditRiskPrediction() {
  const [activeTab, setActiveTab] = useState("customer")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (isCheckingAuth && session !== undefined) {
      if (!session) {
        router.push("/login")
      } else {
        setIsCheckingAuth(false)
      }
    }
  }, [session, isCheckingAuth, router])

  // Customer Info State
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    customerId: "",
    photo: "",
    branch: "HEAD OFFICE",
    status: "CURRENT RUNNING",
    equipmentType: "",
    schemeType: "",
    rentalPaymentType: "",
    grantedDate: "",
    occupation: "",
    monthlyIncome: 0,
    maritalStatus: "Single",
    dependents: 0,
    Age: 0
  })

  // Financial Data State
  const [financialData, setFinancialData] = useState<FinancialData>({
    FacilityAmount: 0,
    Tenor: 0,
    EffectiveRate: 0,
    FlatRate: 0,
    NetRental: 0,
    DownPayment: 0,
    NoOfRentalInArrears: 0,
    ArrearsCapital: 0,
    ArrearsInterest: 0,
    ArrearsVat: 0,
    ArrearsOD: 0,
    LastReceiptPaidAmount: 0,
    Prepayment: 0,
    arrears_intensity: 0,
    debt_to_income_ratio: 0,
    payment_coverage: 0,
    arrears_ratio: 0,
    overdue_intensity: 0,
    payment_regularity: 0,
    has_arrears: 0,
    high_interest_flag: 0,
    early_settlement: 0,
    equipment_risk_score: 0,
    branch_encoded: 0,
    scheme_encoded: 0,
    loan_age: 0,
    tenor_to_age_ratio: 0
  })

  // Behavioral Data State
  const [behavioralData, setBehavioralData] = useState<BehavioralData>({
    onTimePaymentPercentage: 0,
    latePaymentFrequency: 0,
    gracePeriodUsage: 0,
    customerResponsiveness: 3,
    complaintFrequency: 0,
    relationshipDuration: 0,
    savingsRate: 0,
    creditUtilization: 0,
    previousDefaults: 0,
    partialPayments: 0,
    paymentReschedules: 0,
    earlySettlementHistory: false,
    employmentStability: 3,
    addressStability: 3,
    referenceChecks: 3
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_info: customerInfo,
          financial_data: financialData,
          behavioral_data: behavioralData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get prediction')
      }

      const data: PredictionResponse = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isAllFieldsZero = () => {
    // Check if all numeric fields in customer info are 0
    const customerNumericZero = 
      customerInfo.monthlyIncome === 0 &&
      customerInfo.dependents === 0 &&
      customerInfo.Age === 0

    // Check if all numeric fields in financial data are 0
    const financialAllZero = Object.values(financialData).every(val => val === 0)

    // Check if all numeric fields in behavioral data are 0
    const behavioralNumericZero = 
      behavioralData.onTimePaymentPercentage === 0 &&
      behavioralData.latePaymentFrequency === 0 &&
      behavioralData.gracePeriodUsage === 0 &&
      behavioralData.customerResponsiveness === 0 &&
      behavioralData.complaintFrequency === 0 &&
      behavioralData.relationshipDuration === 0 &&
      behavioralData.savingsRate === 0 &&
      behavioralData.creditUtilization === 0 &&
      behavioralData.previousDefaults === 0 &&
      behavioralData.partialPayments === 0 &&
      behavioralData.paymentReschedules === 0 &&
      behavioralData.employmentStability === 0 &&
      behavioralData.addressStability === 0 &&
      behavioralData.referenceChecks === 0

    return customerNumericZero && financialAllZero && behavioralNumericZero
  }

  const getRiskColor = (category: string) => {
    switch (category) {
      case "Low Risk":
        return "text-green-600 bg-green-50 border-green-200"
      case "Medium Risk":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "High Risk":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "Very High Risk":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getRiskIcon = (category: string) => {
    switch (category) {
      case "Low Risk":
        return <CheckCircle2 className="h-6 w-6" />
      case "Medium Risk":
        return <AlertCircle className="h-6 w-6" />
      case "High Risk":
        return <AlertTriangle className="h-6 w-6" />
      case "Very High Risk":
        return <XCircle className="h-6 w-6" />
      default:
        return <Info className="h-6 w-6" />
    }
  }

  if (isCheckingAuth || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30">
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Checking authentication...</h2>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      <AppHeader />
      
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            Credit Risk Assessment
          </h1>
          <p className="text-muted-foreground">
            AI-powered probability of default prediction with actionable insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Enter customer details to assess credit risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="customer">
                      <User className="h-4 w-4 mr-2" />
                      Customer
                    </TabsTrigger>
                    <TabsTrigger value="financial">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Financial
                    </TabsTrigger>
                    <TabsTrigger value="behavioral">
                      <Activity className="h-4 w-4 mr-2" />
                      Behavioral
                    </TabsTrigger>
                  </TabsList>

                  {/* Customer Info Tab */}
                  <TabsContent value="customer" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Customer Name</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerId">Customer ID</Label>
                        <Input
                          id="customerId"
                          value={customerInfo.customerId}
                          onChange={(e) => setCustomerInfo({...customerInfo, customerId: e.target.value})}
                          placeholder="CUST001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch</Label>
                        <Select 
                          value={customerInfo.branch}
                          onValueChange={(value) => setCustomerInfo({...customerInfo, branch: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ANURADHAPURA">ANURADHAPURA</SelectItem>
                            <SelectItem value="BADULLA">BADULLA</SelectItem>
                            <SelectItem value="HEAD OFFICE">HEAD OFFICE</SelectItem>
                            <SelectItem value="HYDE PARK">HYDE PARK</SelectItem>
                            <SelectItem value="KANDY">KANDY</SelectItem>
                            <SelectItem value="KOTTAWA">KOTTAWA</SelectItem>
                            <SelectItem value="MATARA">MATARA</SelectItem>
                            <SelectItem value="MATHUGAMA">MATHUGAMA</SelectItem>
                            <SelectItem value="MELSIRIPURA">MELSIRIPURA</SelectItem>
                            <SelectItem value="MINUWANGODA">MINUWANGODA</SelectItem>
                            <SelectItem value="MULLAITIVU">MULLAITIVU</SelectItem>
                            <SelectItem value="NARAMMALA">NARAMMALA</SelectItem>
                            <SelectItem value="WELLAWATHTHA">WELLAWATHTHA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={customerInfo.status}
                          onValueChange={(value) => setCustomerInfo({...customerInfo, status: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CURRENT RUNNING">CURRENT RUNNING</SelectItem>
                            <SelectItem value="EARLY SETTLEMENT COMPLETED">EARLY SETTLEMENT COMPLETED</SelectItem>
                            <SelectItem value="INITIATED/NOT ACTIVATED">INITIATED/NOT ACTIVATED</SelectItem>
                            <SelectItem value="NORMAL SETTLEMENT COMPLETED">NORMAL SETTLEMENT COMPLETED</SelectItem>
                            <SelectItem value="REPOSSESSION AND SOLD">REPOSSESSION AND SOLD</SelectItem>
                            <SelectItem value="RESCHEDULED">RESCHEDULED</SelectItem>
                            <SelectItem value="WRITE OFF">WRITE OFF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={customerInfo.occupation}
                          onChange={(e) => setCustomerInfo({...customerInfo, occupation: e.target.value})}
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthlyIncome">Monthly Income</Label>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          value={customerInfo.monthlyIncome}
                          onChange={(e) => setCustomerInfo({...customerInfo, monthlyIncome: Number(e.target.value)})}
                          placeholder="50000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maritalStatus">Marital Status</Label>
                        <Select 
                          value={customerInfo.maritalStatus}
                          onValueChange={(value) => setCustomerInfo({...customerInfo, maritalStatus: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dependents">Dependents</Label>
                        <Input
                          id="dependents"
                          type="number"
                          value={customerInfo.dependents}
                          onChange={(e) => setCustomerInfo({...customerInfo, dependents: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={customerInfo.Age}
                          onChange={(e) => setCustomerInfo({...customerInfo, Age: Number(e.target.value)})}
                          placeholder="30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grantedDate">Granted Date</Label>
                        <Input
                          id="grantedDate"
                          type="date"
                          value={customerInfo.grantedDate}
                          onChange={(e) => setCustomerInfo({...customerInfo, grantedDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schemeType">Scheme Type</Label>
                        <Select 
                          value={customerInfo.schemeType}
                          onValueChange={(value) => setCustomerInfo({...customerInfo, schemeType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select scheme type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NORMAL">NORMAL</SelectItem>
                            <SelectItem value="STEP-UP">STEP-UP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Financial Data Tab */}
                  <TabsContent value="financial" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facilityAmount">Facility Amount</Label>
                        <Input
                          id="facilityAmount"
                          type="number"
                          value={financialData.FacilityAmount}
                          onChange={(e) => setFinancialData({...financialData, FacilityAmount: Number(e.target.value)})}
                          placeholder="100000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenor">Tenor (months)</Label>
                        <Input
                          id="tenor"
                          type="number"
                          value={financialData.Tenor}
                          onChange={(e) => setFinancialData({...financialData, Tenor: Number(e.target.value)})}
                          placeholder="12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="effectiveRate">Effective Rate (%)</Label>
                        <Input
                          id="effectiveRate"
                          type="number"
                          step="0.01"
                          value={financialData.EffectiveRate}
                          onChange={(e) => setFinancialData({...financialData, EffectiveRate: Number(e.target.value)})}
                          placeholder="12.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="flatRate">Flat Rate (%)</Label>
                        <Input
                          id="flatRate"
                          type="number"
                          step="0.01"
                          value={financialData.FlatRate}
                          onChange={(e) => setFinancialData({...financialData, FlatRate: Number(e.target.value)})}
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="netRental">Net Rental</Label>
                        <Input
                          id="netRental"
                          type="number"
                          value={financialData.NetRental}
                          onChange={(e) => setFinancialData({...financialData, NetRental: Number(e.target.value)})}
                          placeholder="10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="downPayment">Down Payment</Label>
                        <Input
                          id="downPayment"
                          type="number"
                          value={financialData.DownPayment}
                          onChange={(e) => setFinancialData({...financialData, DownPayment: Number(e.target.value)})}
                          placeholder="20000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="noOfRentalInArrears">No. of Rentals in Arrears</Label>
                        <Input
                          id="noOfRentalInArrears"
                          type="number"
                          value={financialData.NoOfRentalInArrears}
                          onChange={(e) => setFinancialData({...financialData, NoOfRentalInArrears: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arrearsCapital">Arrears Capital</Label>
                        <Input
                          id="arrearsCapital"
                          type="number"
                          value={financialData.ArrearsCapital}
                          onChange={(e) => setFinancialData({...financialData, ArrearsCapital: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arrearsInterest">Arrears Interest</Label>
                        <Input
                          id="arrearsInterest"
                          type="number"
                          value={financialData.ArrearsInterest}
                          onChange={(e) => setFinancialData({...financialData, ArrearsInterest: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arrearsOD">Arrears OD</Label>
                        <Input
                          id="arrearsOD"
                          type="number"
                          value={financialData.ArrearsOD}
                          onChange={(e) => setFinancialData({...financialData, ArrearsOD: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastReceiptPaidAmount">Last Receipt Paid</Label>
                        <Input
                          id="lastReceiptPaidAmount"
                          type="number"
                          value={financialData.LastReceiptPaidAmount}
                          onChange={(e) => setFinancialData({...financialData, LastReceiptPaidAmount: Number(e.target.value)})}
                          placeholder="10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prepayment">Prepayment</Label>
                        <Input
                          id="prepayment"
                          type="number"
                          value={financialData.Prepayment}
                          onChange={(e) => setFinancialData({...financialData, Prepayment: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Behavioral Data Tab */}
                  <TabsContent value="behavioral" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="onTimePaymentPercentage">On-Time Payment %</Label>
                        <Input
                          id="onTimePaymentPercentage"
                          type="number"
                          step="0.01"
                          value={behavioralData.onTimePaymentPercentage}
                          onChange={(e) => setBehavioralData({...behavioralData, onTimePaymentPercentage: Number(e.target.value)})}
                          placeholder="85.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="latePaymentFrequency">Late Payment Frequency</Label>
                        <Input
                          id="latePaymentFrequency"
                          type="number"
                          value={behavioralData.latePaymentFrequency}
                          onChange={(e) => setBehavioralData({...behavioralData, latePaymentFrequency: Number(e.target.value)})}
                          placeholder="2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gracePeriodUsage">Grace Period Usage</Label>
                        <Input
                          id="gracePeriodUsage"
                          type="number"
                          value={behavioralData.gracePeriodUsage}
                          onChange={(e) => setBehavioralData({...behavioralData, gracePeriodUsage: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerResponsiveness">Customer Responsiveness (1-5)</Label>
                        <Input
                          id="customerResponsiveness"
                          type="number"
                          min="1"
                          max="5"
                          value={behavioralData.customerResponsiveness}
                          onChange={(e) => setBehavioralData({...behavioralData, customerResponsiveness: Number(e.target.value)})}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complaintFrequency">Complaint Frequency</Label>
                        <Input
                          id="complaintFrequency"
                          type="number"
                          value={behavioralData.complaintFrequency}
                          onChange={(e) => setBehavioralData({...behavioralData, complaintFrequency: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relationshipDuration">Relationship Duration (months)</Label>
                        <Input
                          id="relationshipDuration"
                          type="number"
                          value={behavioralData.relationshipDuration}
                          onChange={(e) => setBehavioralData({...behavioralData, relationshipDuration: Number(e.target.value)})}
                          placeholder="24"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="creditUtilization">Credit Utilization %</Label>
                        <Input
                          id="creditUtilization"
                          type="number"
                          step="0.01"
                          value={behavioralData.creditUtilization}
                          onChange={(e) => setBehavioralData({...behavioralData, creditUtilization: Number(e.target.value)})}
                          placeholder="45.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="previousDefaults">Previous Defaults</Label>
                        <Input
                          id="previousDefaults"
                          type="number"
                          value={behavioralData.previousDefaults}
                          onChange={(e) => setBehavioralData({...behavioralData, previousDefaults: Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employmentStability">Employment Stability (1-5)</Label>
                        <Input
                          id="employmentStability"
                          type="number"
                          min="1"
                          max="5"
                          value={behavioralData.employmentStability}
                          onChange={(e) => setBehavioralData({...behavioralData, employmentStability: Number(e.target.value)})}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressStability">Address Stability (1-5)</Label>
                        <Input
                          id="addressStability"
                          type="number"
                          min="1"
                          max="5"
                          value={behavioralData.addressStability}
                          onChange={(e) => setBehavioralData({...behavioralData, addressStability: Number(e.target.value)})}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referenceChecks">Reference Checks (1-5)</Label>
                        <Input
                          id="referenceChecks"
                          type="number"
                          min="1"
                          max="5"
                          value={behavioralData.referenceChecks}
                          onChange={(e) => setBehavioralData({...behavioralData, referenceChecks: Number(e.target.value)})}
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {isAllFieldsZero() && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please enter valid data. All numeric fields cannot be zero.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading || isAllFieldsZero()}
                    className="flex-1"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Predict Risk
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              {/* Risk Score Card */}
              <Card className={`border-2 ${getRiskColor(result.risk_category)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Risk Assessment</CardTitle>
                    {getRiskIcon(result.risk_category)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">
                      {(result.pd * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Probability of Default
                    </div>
                    <Badge className={`text-sm px-4 py-2 ${getRiskColor(result.risk_category)}`}>
                      {result.risk_category}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span className="font-semibold">{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={result.confidence * 100} className="h-2" />
                  </div>

                  <div className="pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Model Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium">{result.model_used}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-medium">{(result.model_performance.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precision</span>
                      <span className="font-medium">{(result.model_performance.precision * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recall</span>
                      <span className="font-medium">{(result.model_performance.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AUC Score</span>
                      <span className="font-medium">{(result.model_performance.auc_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Key Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.top_features.map((feature, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{feature.feature}</span>
                          <span className={feature.impact === "increases_risk" ? "text-red-600" : "text-green-600"}>
                            {feature.impact === "increases_risk" ? "↑" : "↓"} {Math.abs(feature.contribution * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.abs(feature.contribution) * 100} 
                          className={`h-1.5 ${feature.impact === "increases_risk" ? "bg-red-100" : "bg-green-100"}`}
                        />
                        <div className="text-xs text-muted-foreground">
                          Value: {feature.value} | Importance: {(feature.importance * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {!result && !error && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Enter customer information and click "Predict Risk" to see the analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
