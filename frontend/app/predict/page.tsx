"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Calculator, 
  TrendingUp, 
  BarChart3, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  DollarSign,
  Calendar,
  Percent,
  Clock,
  User
} from "lucide-react"

type PredictResponse = {
  impairment: number
  ecl_1yr: number
  impairment_model: string
  ecl_model: string
  impairment_accuracy: string
  ecl_accuracy: string
}

export default function PredictPage() {
  const router = useRouter()

  // Default values set to 0
  const [facility_amount, setFacilityAmount] = useState("0")
  const [tenor, setTenor] = useState("0")
  const [effec_rate, setEffecRate] = useState("0")
  const [flat_rate, setFlatRate] = useState("0")
  const [net_rental, setNetRental] = useState("0")
  const [no_of_rental_in_arrears, setArrears] = useState("0")
  const [age, setAge] = useState("0")
  const [due_date, setDueDate] = useState("0")

  const [result, setResult] = useState<PredictResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const payload: any = {
      facility_amount: parseFloat(facility_amount || "0"),
      tenor: parseInt(tenor || "0", 10),
      effec_rate: parseFloat(effec_rate || "0"),
      flat_rate: parseFloat(flat_rate || "0"),
      net_rental: parseFloat(net_rental || "0"),
      no_of_rental_in_arrears: parseFloat(no_of_rental_in_arrears || "0"),
      age: parseFloat(age || "0"),
      due_date: parseInt(due_date || "0", 10)
    }

    // If all inputs are zero, don't call the API
    const numericValues = [
      payload.facility_amount,
      payload.tenor,
      payload.effec_rate,
      payload.flat_rate,
      payload.net_rental,
      payload.no_of_rental_in_arrears,
      payload.age,
      payload.due_date,
    ]

    if (numericValues.every((v) => Number(v) === 0)) {
      setError("All inputs are zero. Please enter at least one non-zero value to predict.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail || `Server returned ${res.status}`)
      }

      const data: PredictResponse = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Credit Risk Assessment
              </h1>
              <p className="text-gray-600 mt-2">
                Predict impairment and 1-year Expected Credit Loss (ECL) with machine learning models
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Input Parameters</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Facility Amount */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <DollarSign className="h-4 w-4" />
                    Facility Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={facility_amount}
                      onChange={(e) => setFacilityAmount(e.target.value)}
                      className="pl-8 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="150000"
                    />
                  </div>
                </div>

                {/* Tenor */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4" />
                    Tenor (months)
                  </label>
                  <input
                    type="number"
                    value={tenor}
                    onChange={(e) => setTenor(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="36"
                  />
                </div>

                {/* Effective Rate */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Percent className="h-4 w-4" />
                    Effective Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={effec_rate}
                    onChange={(e) => setEffecRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="8.5"
                  />
                </div>

                {/* Flat Rate */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Percent className="h-4 w-4" />
                    Flat Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={flat_rate}
                    onChange={(e) => setFlatRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="7"
                  />
                </div>

                {/* Net Rental */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <DollarSign className="h-4 w-4" />
                    Net Rental
                  </label>
                  <input
                    type="number"
                    value={net_rental}
                    onChange={(e) => setNetRental(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="5200"
                  />
                </div>

                {/* Rental Arrears */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <AlertCircle className="h-4 w-4" />
                    Rentals in Arrears
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={no_of_rental_in_arrears}
                    onChange={(e) => setArrears(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="1.5"
                  />
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    Age
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="42.3"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4" />
                    Due Date (days, optional)
                  </label>
                  <input
                    type="number"
                    value={due_date}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="548"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing Prediction...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      Calculate Risk Assessment
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="w-40 bg-white border border-gray-200 text-gray-700 font-medium py-4 px-4 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 mt-1 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-8">
            {/* Results Card */}
            {result ? (
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                  <h2 className="text-2xl font-semibold text-gray-800">Risk Assessment Results</h2>
                </div>

                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-blue-900 uppercase tracking-wider">
                            Impairment
                          </h3>
                          <p className="text-3xl font-bold text-blue-900 mt-1">
                            {result.impairment.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-blue-700">
                        Model: <span className="font-semibold">{result.impairment_model}</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        Accuracy: <span className="font-semibold">{result.impairment_accuracy}</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-green-900 uppercase tracking-wider">
                            1-Year ECL
                          </h3>
                          <p className="text-3xl font-bold text-green-900 mt-1">
                            {result.ecl_1yr.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-green-700">
                        Model: <span className="font-semibold">{result.ecl_model}</span>
                      </div>
                      <div className="text-sm text-green-700">
                        Accuracy: <span className="font-semibold">{result.ecl_accuracy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 p-5 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Analysis Summary
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        The machine learning models have analyzed the input parameters and generated 
                        the following risk assessment. Both impairment and Expected Credit Loss 
                        calculations are based on validated predictive models.
                      </p>
                      <p className="pt-2 text-xs text-gray-500">
                        Note: These predictions are for informational purposes and should be 
                        reviewed by qualified financial professionals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder Card */
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-3">
                    Risk Assessment Results
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Submit the form to calculate impairment and 1-year Expected Credit Loss.
                    Results will appear here with detailed model information.
                  </p>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>• Real-time ML predictions</p>
                    <p>• Model accuracy metrics</p>
                    <p>• Professional risk assessment</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                About These Predictions
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Impairment</span> represents the present value of 
                  expected credit losses on financial assets.
                </p>
                <p>
                  <span className="font-medium">Expected Credit Loss (ECL)</span> is a forward-looking 
                  estimate of credit losses over a 1-year period, in line with IFRS 9 requirements.
                </p>
                <p className="pt-2 text-xs text-gray-500">
                  Predictions are generated using trained machine learning models. Actual results 
                  may vary based on market conditions and additional risk factors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}