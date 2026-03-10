"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Loader2, CheckCircle2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface EmployeeInput {
  Branch: string;
  Gender: string;
  Age: number;
  Years_At_Company: number;
  Monthly_Salary: number;
  average_Work_Hours_Per_Week: number;
  Overtime_Hours: number;
  Sick_Days: number;
  Employee_Satisfaction_Score: number;
}

interface PerformanceScore {
  hybrid: number;
  random_forest: number;
  xgboost: number;
  catboost: number;
}

interface EmployeePredictionResult {
  performance_score: PerformanceScore;
  hybrid_weights: Record<string, number>;
}

// Exact label strings from the trained LabelEncoder
const BRANCHES = [
  "Badulla",
  "Head Office",
  "Kandy",
  "Kottawa",
  "Matara",
  "Mathugama",
  "Melsiripura",
  "Mullaitivu",
  "Narammala",
];

const GENDERS = ["Female", "Male"];

const defaultEmployee: EmployeeInput = {
  Branch: BRANCHES[1], // Head Office
  Gender: GENDERS[1],  // Male
  Age: 32,
  Years_At_Company: 4,
  Monthly_Salary: 85000,
  average_Work_Hours_Per_Week: 44,
  Overtime_Hours: 8,
  Sick_Days: 3,
  Employee_Satisfaction_Score: 3.8,
};

const scoreColor = (score: number) => {
  if (score >= 3.75) return "text-green-600";
  if (score >= 2.5) return "text-yellow-600";
  return "text-red-600";
};

export function EmployeePerformanceAnalyzer() {
  const [employee, setEmployee] = useState<EmployeeInput>(defaultEmployee);
  const [result, setResult] = useState<EmployeePredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = <K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) => {
    setEmployee((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!employee.Branch || !employee.Gender) {
      toast.error("Please select a Branch and Gender before predicting.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/branch-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || "Prediction failed");
      }

      const data: EmployeePredictionResult = await response.json();
      setResult(data);
      toast.success("Prediction Complete", {
        description: `Hybrid performance score: ${Math.min(data.performance_score.hybrid, 5).toFixed(2)} / 5`,
      });
    } catch (error) {
      toast.error("Prediction Failed", {
        description: error instanceof Error ? error.message : "Please check backend connection",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20 mt-1">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Employee Performance
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                R²-weighted hybrid: RandomForest · XGBoost · CatBoost
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Branch & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Branch</Label>
              <Select
                value={employee.Branch}
                onValueChange={(v) => updateField("Branch", v)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select
                value={employee.Gender}
                onValueChange={(v) => updateField("Gender", v)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Numeric fields */}
          {[
            { key: "Age" as const, label: "Age (years)", min: 18, max: 65, step: 1 },
            { key: "Years_At_Company" as const, label: "Years at Company", min: 0, max: 40, step: 0.5 },
            { key: "Monthly_Salary" as const, label: "Monthly Salary (LKR)", min: 0, max: 500000, step: 1000 },
            { key: "average_Work_Hours_Per_Week" as const, label: "Avg Work Hours / Week", min: 0, max: 80, step: 0.5 },
            { key: "Overtime_Hours" as const, label: "Overtime Hours", min: 0, max: 100, step: 0.5 },
            { key: "Sick_Days" as const, label: "Sick Days (per year)", min: 0, max: 60, step: 1 },
            { key: "Employee_Satisfaction_Score" as const, label: "Satisfaction Score (1–5)", min: 1, max: 5, step: 0.1 },
          ].map(({ key, label, min, max, step }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-xs">{label}</Label>
              <Input
                id={key}
                type="number"
                min={min}
                max={max}
                step={step}
                className="h-9 text-xs"
                value={employee[key]}
                onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}

          <Button
            onClick={handleAnalyze}
            disabled={loading || !employee.Branch || !employee.Gender}
            className="w-full h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Predicting…</>
            ) : (
              <><BarChart3 className="mr-2 h-4 w-4" />Predict Performance Score</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Performance Results</CardTitle>
          <CardDescription className="text-xs">Hybrid ensemble prediction with per-model breakdown</CardDescription>
        </CardHeader>

        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30 mb-4">
                <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
              <p className="text-sm text-muted-foreground">Fill in employee details and click Predict</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hybrid Score */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-200 dark:border-emerald-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Hybrid Performance Score</h3>
                  <Badge className="bg-emerald-600 text-white border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ensemble
                  </Badge>
                </div>
                <div className={`text-4xl font-bold mb-2 ${scoreColor(result.performance_score.hybrid)}`}>
                  {Math.min(result.performance_score.hybrid, 5).toFixed(2)} / 5
                </div>
                <Progress value={(Math.min(result.performance_score.hybrid, 5) / 5) * 100} className="h-2 bg-emerald-200 dark:bg-emerald-900/30" />
              </div>

              {/* Per-model breakdown */}
              <div className="space-y-2">
                {(["random_forest", "xgboost", "catboost"] as const).map((modelKey) => {
                  const label = { random_forest: "Random Forest", xgboost: "XGBoost", catboost: "CatBoost" }[modelKey];
                  const score = result.performance_score[modelKey];
                  const weight = result.hybrid_weights[label] ?? 0;
                  return (
                    <div key={modelKey} className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{label}</span>
                        <span className={`font-semibold ${scoreColor(score)}`}>
                          {Math.min(score, 5).toFixed(2)} / 5
                        </span>
                      </div>
                      <Progress value={(Math.min(score, 5) / 5) * 100} className="h-1.5" />
                      <div className="text-xs text-muted-foreground mt-1">
                        Weight: {(weight * 100).toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              <Alert className="border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs text-muted-foreground">
                  Score reflects weighted performance using R²-optimised model blending.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
