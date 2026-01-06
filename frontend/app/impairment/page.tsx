"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/utils/auth-client";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  DollarSign,
  Calendar,
  Percent,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface ImpairmentFormData {
  age: number;
  due_date: number;
  effec_rate: number;
  facility_amount: number;
  flat_rate: number;
  net_rental: number;
  no_of_rental_in_arrears: number;
  tenor: number;
}

interface ImpairmentResult {
  impairment: number;
  ecl_1yr: number;
  impairment_model: string;
  ecl_model: string;
  impairment_accuracy: string;
  ecl_accuracy: string;
}

export default function ImpairmentPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [formData, setFormData] = useState<ImpairmentFormData>({
    age: 0,
    due_date: 0,
    effec_rate: 0,
    facility_amount: 0,
    flat_rate: 0,
    net_rental: 0,
    no_of_rental_in_arrears: 0,
    tenor: 0,
  });

  const [result, setResult] = useState<ImpairmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isCheckingAuth && session !== undefined) {
      if (!session) {
        router.push("/login");
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [session, isCheckingAuth, router]);

  const updateField = (key: keyof ImpairmentFormData, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isAllFieldsZero = () => {
    return Object.values(formData).every((value) => value === 0);
  };

  const validateInputs = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Percentage validations
    if (formData.effec_rate < 0 || formData.effec_rate > 100) {
      errors.push("Effective rate must be between 0% and 100%");
    }
    if (formData.flat_rate < 0 || formData.flat_rate > 100) {
      errors.push("Flat rate must be between 0% and 100%");
    }

    // Minimum value validations to prevent unrealistic predictions
    if (formData.facility_amount < 10000) {
      errors.push("Facility amount must be at least LKR 10,000 for accurate predictions");
    }
    if (formData.facility_amount > 100000000) {
      errors.push("Facility amount exceeds maximum limit of LKR 100,000,000");
    }
    
    if (formData.net_rental < 100) {
      errors.push("Net rental must be at least LKR 100 for accurate predictions");
    }
    if (formData.net_rental > 5000000) {
      errors.push("Net rental exceeds maximum limit of LKR 5,000,000");
    }

    // Rate validations - must have at least one rate specified
    if (formData.effec_rate === 0 && formData.flat_rate === 0) {
      errors.push("Please specify at least one interest rate (Effective or Flat rate)");
    }
    if (formData.effec_rate > 50) {
      errors.push("Effective rate above 50% is unusually high, please verify");
    }
    if (formData.flat_rate > 40) {
      errors.push("Flat rate above 40% is unusually high, please verify");
    }

    // Time-based validations
    if (formData.age < 0 || formData.age > 600) {
      errors.push("Age must be between 0 and 600 months");
    }
    if (formData.tenor < 6 || formData.tenor > 240) {
      errors.push("Tenor must be between 6 and 240 months for realistic calculations");
    }
    if (formData.age > formData.tenor) {
      errors.push("Age cannot be greater than tenor (loan must be within its term)");
    }
    
    if (formData.due_date < 0) {
      errors.push("Due date cannot be negative");
    }
    if (formData.no_of_rental_in_arrears < 0) {
      errors.push("Rental in arrears cannot be negative");
    }

    // Business logic validations
    if (formData.net_rental > formData.facility_amount) {
      errors.push("Net rental cannot exceed facility amount");
    }

    // Warn about potentially unreliable predictions
    const sumOfValues = formData.facility_amount + formData.net_rental + 
                        formData.age + formData.tenor + formData.effec_rate + formData.flat_rate;
    if (sumOfValues < 1000) {
      errors.push("Input values are too low for reliable predictions. Please enter realistic facility data");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleCalculate = async () => {
    if (isAllFieldsZero()) {
      toast.error("Validation Error", {
        description: "Please fill in at least one field with a non-zero value",
      });
      return;
    }

    const validation = validateInputs();
    if (!validation.isValid) {
      toast.error("Validation Failed", {
        description: validation.errors.join(", "),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate impairment");
      }

      const data: ImpairmentResult = await response.json();
      
      // Validate results - impairment and ECL should not be negative
      if (data.impairment < 0 || data.ecl_1yr < 0) {
        toast.error("Invalid Prediction Result", {
          description: "Model returned negative values. Please verify your input data and try again with realistic values.",
        });
        return;
      }

      // Warn if values are unusually high
      if (data.impairment > formData.facility_amount * 2) {
        toast.warning("Unusually High Impairment", {
          description: "Impairment exceeds 200% of facility amount. Please verify input values are correct.",
        });
      }

      setResult(data);
      toast.success("Calculation Complete", {
        description: "Impairment and ECL values calculated successfully",
      });
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("Calculation Failed", {
        description: "Please check your connection and try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isCheckingAuth || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950/30 dark:to-indigo-950/30">
              <Loader2 className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Checking authentication...</h2>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Impairment & ECL Calculator
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Calculate expected credit loss and impairment using AI models
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Facility Information</CardTitle>
                  <CardDescription className="text-xs">
                    Enter facility details for impairment calculation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Financial Metrics */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <DollarSign className="h-4 w-4" />
                  Financial Details
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="facility-amount" className="text-xs font-medium">
                      Facility Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">
                        LKR
                      </span>
                      <Input
                        id="facility-amount"
                        type="number"
                        min="10000"
                        max="100000000"
                        className="pl-11 h-10 bg-white dark:bg-slate-950"
                        value={formData.facility_amount}
                        onChange={(e) =>
                          updateField("facility_amount", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="net-rental" className="text-xs font-medium">
                      Net Rental
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">
                        LKR
                      </span>
                      <Input
                        id="net-rental"
                        type="number"
                        min="100"
                        max="5000000"
                        className="pl-11 h-10 bg-white dark:bg-slate-950"
                        value={formData.net_rental}
                        onChange={(e) =>
                          updateField("net_rental", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Interest Rates */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                  <Percent className="h-4 w-4" />
                  Interest Rates
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="effec-rate" className="text-xs font-medium">
                      Effective Rate
                    </Label>
                    <div className="relative">
                      <Input
                        id="effec-rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        className="pr-8 h-10 bg-white dark:bg-slate-950"
                        value={formData.effec_rate}
                        onChange={(e) =>
                          updateField("effec_rate", parseFloat(e.target.value) || 0)
                        }
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-medium">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="flat-rate" className="text-xs font-medium">
                      Flat Rate
                    </Label>
                    <div className="relative">
                      <Input
                        id="flat-rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="40"
                        className="pr-8 h-10 bg-white dark:bg-slate-950"
                        value={formData.flat_rate}
                        onChange={(e) =>
                          updateField("flat_rate", parseFloat(e.target.value) || 0)
                        }
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-medium">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timing & Arrears */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <Clock className="h-4 w-4" />
                  Timing & Performance
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="text-xs font-medium">
                        Age (months)
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        step="0.1"
                        min="0"
                        max="600"
                        className="h-10 bg-white dark:bg-slate-950"
                        value={formData.age}
                        onChange={(e) =>
                          updateField("age", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tenor" className="text-xs font-medium">
                        Tenor (months)
                      </Label>
                      <Input
                        id="tenor"
                        type="number"
                        min="6"
                        max="240"
                        className="h-10 bg-white dark:bg-slate-950"
                        value={formData.tenor}
                        onChange={(e) =>
                          updateField("tenor", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="due-date" className="text-xs font-medium">
                        Due Date (days)
                      </Label>
                      <Input
                        id="due-date"
                        type="number"
                        min="0"
                        className="h-10 bg-white dark:bg-slate-950"
                        value={formData.due_date}
                        onChange={(e) =>
                          updateField("due_date", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="arrears" className="text-xs font-medium">
                        Rental in Arrears
                      </Label>
                      <Input
                        id="arrears"
                        type="number"
                        step="0.1"
                        min="0"
                        className="h-10 bg-white dark:bg-slate-950"
                        value={formData.no_of_rental_in_arrears}
                        onChange={(e) =>
                          updateField("no_of_rental_in_arrears", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isAllFieldsZero() && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">Validation Required</AlertTitle>
                  <AlertDescription className="text-xs">
                    Please fill in at least one field with a non-zero value
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCalculate}
                disabled={isLoading || isAllFieldsZero()}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Impairment & ECL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Calculation Results</CardTitle>
                  <CardDescription className="text-xs">
                    AI-powered impairment and ECL predictions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {!result ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950/30 dark:to-indigo-950/30 mb-4">
                    <TrendingDown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter facility details and click calculate to see predictions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Impairment Result */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-2 border-rose-200 dark:border-rose-900/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-600">
                          <TrendingDown className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-rose-900 dark:text-rose-100">
                          Impairment
                        </h3>
                      </div>
                      <Badge className="bg-rose-600 text-white border-0">
                        {result.impairment_model}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-rose-700 dark:text-rose-300 mb-2">
                      {formatCurrency(result.impairment)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Model Accuracy:</span>
                      <Badge variant="outline" className="border-rose-300 text-rose-700 dark:text-rose-400">
                        {result.impairment_accuracy}
                      </Badge>
                    </div>
                    <Progress 
                      value={parseFloat(result.impairment_accuracy)} 
                      className="mt-3 h-2 bg-rose-200 dark:bg-rose-900/30" 
                    />
                  </div>

                  <Separator />

                  {/* ECL Result */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-900/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-600">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                          1 Year ECL
                        </h3>
                      </div>
                      <Badge className="bg-blue-600 text-white border-0">
                        {result.ecl_model}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                      {formatCurrency(result.ecl_1yr)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Model Accuracy:</span>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-400">
                        {result.ecl_accuracy}
                      </Badge>
                    </div>
                    <Progress 
                      value={parseFloat(result.ecl_accuracy)} 
                      className="mt-3 h-2 bg-blue-200 dark:bg-blue-900/30" 
                    />
                  </div>

                  {/* Summary */}
                  <Alert className="border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-sm font-semibold text-green-900 dark:text-green-100">
                      Calculation Complete
                    </AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground mt-1">
                      Both impairment and ECL values have been calculated using ensemble AI models with high accuracy rates.
                    </AlertDescription>
                  </Alert>

                  {/* Models Info */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="text-xs text-muted-foreground mb-1">Impairment Model</div>
                      <div className="font-semibold text-sm">{result.impairment_model}</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {result.impairment_accuracy} accurate
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="text-xs text-muted-foreground mb-1">ECL Model</div>
                      <div className="font-semibold text-sm">{result.ecl_model}</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {result.ecl_accuracy} accurate
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
