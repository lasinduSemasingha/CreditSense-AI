"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Loader2,
  Calculator,
  Database,
  Upload,
  Trash2,
  CheckCircle2,
  BarChart3,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface FacilityData {
  Branch: string;
  "Facility Type": string;
  FacilityAmount: number;
  "Effective Rate": number;
  "No of Rental in arrears": number;
  Age: number;
  ArrearsCapital: number;
  ArrearsInterest: number;
  ArrearsVat: number;
  ArrearsOD: number;
  FutureCapital: number;
  FutureInterest: number;
  "NET-OUTSTANDING": number;
  Status: string;
  NPLStatus: string;
  "Last Receipt Paid Amount": number;
  CD_Collection_Rental: number;
  ClaimablePercentage: number;
  Arrears_Ratio: number;
}

interface APIFacilityData {
  Branch_encoded: number;
  "Facility Type_encoded": number;
  FacilityAmount: number;
  "Effective Rate": number;
  "No of Rental in arrears": number;
  Age: number;
  ArrearsCapital: number;
  ArrearsInterest: number;
  ArrearsVat: number;
  ArrearsOD: number;
  FutureCapital: number;
  FutureInterest: number;
  "NET-OUTSTANDING": number;
  Status_encoded: number;
  NPLStatus_encoded: number;
  "Last Receipt Paid Amount": number;
  CD_Collection_Rental: number;
  ClaimablePercentage: number;
  Arrears_Ratio: number;
}

const defaultFacility: FacilityData = {
  Branch: "HEAD OFFICE",
  "Facility Type": "Motorcycle",
  FacilityAmount: 500000,
  "Effective Rate": 12.5,
  "No of Rental in arrears": 2,
  Age: 24,
  ArrearsCapital: 45000,
  ArrearsInterest: 3200,
  ArrearsVat: 400,
  ArrearsOD: 1500,
  FutureCapital: 150000,
  FutureInterest: 12000,
  "NET-OUTSTANDING": 212100,
  Status: "CURRENT RUNNING",
  NPLStatus: "Performing (P)",
  "Last Receipt Paid Amount": 25000,
  CD_Collection_Rental: 475000,
  ClaimablePercentage: 85,
  Arrears_Ratio: 0.15,
};

// Function to convert UI facility data to API format
const convertToAPIFormat = (facility: FacilityData): any => {
  return {
    Branch: facility.Branch,
    "Facility Type": facility["Facility Type"],
    FacilityAmount: facility.FacilityAmount,
    "Effective Rate": facility["Effective Rate"],
    "No of Rental in arrears": facility["No of Rental in arrears"],
    Age: facility.Age,
    ArrearsCapital: facility.ArrearsCapital,
    ArrearsInterest: facility.ArrearsInterest,
    ArrearsVat: facility.ArrearsVat,
    ArrearsOD: facility.ArrearsOD,
    FutureCapital: facility.FutureCapital,
    FutureInterest: facility.FutureInterest,
    "NET-OUTSTANDING": facility["NET-OUTSTANDING"],
    Status: facility.Status,
    NPLStatus: facility.NPLStatus.includes("(P)") ? "P" : "N", // Convert "Performing (P)" to "P" and "Non-Performing (N)" to "N"
    "Last Receipt Paid Amount": facility["Last Receipt Paid Amount"],
    CD_Collection_Rental: facility.CD_Collection_Rental,
    ClaimablePercentage: facility.ClaimablePercentage,
    Arrears_Ratio: facility.Arrears_Ratio,
  };
};

const branches = [
  "ANURADHAPURA",
  "BADULLA",
  "HEAD OFFICE",
  "HYDE PARK",
  "KANDY",
  "KOTTAWA",
  "MATARA",
  "MATHUGAMA",
  "MELSIRIPURA",
  "MINUWANGODA",
  "MULLAITIVU",
  "NARAMMALA",
  "WELLAWATHTHA"
];

// Branch encoding mapping
const branchEncoding: { [key: string]: number } = {
  "ANURADHAPURA": 0,
  "BADULLA": 1,
  "HEAD OFFICE": 2,
  "HYDE PARK": 3,
  "KANDY": 4,
  "KOTTAWA": 5,
  "MATARA": 6,
  "MATHUGAMA": 7,
  "MELSIRIPURA": 8,
  "MINUWANGODA": 9,
  "MULLAITIVU": 10,
  "NARAMMALA": 11,
  "WELLAWATHTHA": 12
};

const facilityTypes = ["Motorcycle", "Auto", "Three Wheeler"];

// Facility type encoding
const facilityTypeEncoding: { [key: string]: number } = {
  "Motorcycle": 0,
  "Auto": 1,
  "Three Wheeler": 2
};

const statuses = [
  "CURRENT RUNNING",
  "EARLY SETTLEMENT COMPLETED",
  "INITIATED/NOT ACTIVATED",
  "NORMAL SETTLEMENT COMPLETED",
  "REPOSSESSION AND SOLD",
  "RESCHEDULED",
  "WRITE OFF"
];

// Status encoding
const statusEncoding: { [key: string]: number } = {
  "CURRENT RUNNING": 0,
  "EARLY SETTLEMENT COMPLETED": 1,
  "INITIATED/NOT ACTIVATED": 2,
  "NORMAL SETTLEMENT COMPLETED": 3,
  "REPOSSESSION AND SOLD": 4,
  "RESCHEDULED": 5,
  "WRITE OFF": 6
};

const nplStatuses = ["Performing (P)", "Non-Performing (N)"];

// NPL Status encoding - Critical: 'N' = 1, 'P' = 0
const nplStatusEncoding: { [key: string]: number } = {
  "Performing (P)": 0,
  "Non-Performing (N)": 1
};

interface BranchPerformanceAnalyzerProps {
  onAnalyze: (results: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export function BranchPerformanceAnalyzer({
  onAnalyze,
  setIsLoading,
}: BranchPerformanceAnalyzerProps) {
  const [facility, setFacility] = useState<FacilityData>(defaultFacility);
  const [facilities, setFacilities] = useState<FacilityData[]>([defaultFacility]);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [selectedModel, setSelectedModel] = useState<string>("Random Forest");

  const updateFacility = (key: keyof FacilityData, value: any) => {
    setFacility((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addFacility = () => {
    setFacilities((prev) => [...prev, { ...facility }]);
    toast.success("Facility added to batch", {
      description: `Total facilities: ${facilities.length + 1}`,
    });
  };

  const clearFacilities = () => {
    setFacilities([defaultFacility]);
    setFacility(defaultFacility);
    toast.info("All facilities cleared");
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setIsLoading(true);

      const dataToAnalyze = activeTab === "batch" ? facilities : [facility];

      if (dataToAnalyze.length === 0) {
        toast.error("No facilities to analyze", {
          description: "Please add at least one facility",
        });
        return;
      }

      const predictions = await Promise.all(
        dataToAnalyze.map((fac) => {
          const apiData = convertToAPIFormat(fac);
          return fetch(`/api/predict-facility?model_name=${encodeURIComponent(selectedModel)}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          })
            .then((res) => res.json())
            .then((data) => ({
              ...fac,
              prediction: data.prediction,
              confidence: data.confidence,
              modelUsed: data.model_used,
            }))
        })
      );

      onAnalyze(predictions);
      toast.success("Analysis Complete", {
        description: `Successfully analyzed ${predictions.length} facility${predictions.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis Failed", {
        description: "Please check your connection and try again",
      });
    } finally {
      setAnalyzing(false);
      setIsLoading(false);
    }
  };

  const parseBulkData = () => {
    try {
      const cleanedData = bulkData.trim();
      const jsonString = cleanedData.startsWith("[") ? cleanedData : `[${cleanedData}]`;
      const parsed = JSON.parse(jsonString);
      
      if (!Array.isArray(parsed)) {
        throw new Error("Data must be an array");
      }
      
      setFacilities(parsed);
      toast.success("Data Loaded", {
        description: `Successfully loaded ${parsed.length} facilities`,
      });
    } catch (error) {
      toast.error("Invalid JSON Format", {
        description: "Please check your JSON syntax",
      });
    }
  };

  const [bulkData, setBulkData] = useState("");

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-3xl rounded-full -z-0" />
      
      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20 mt-1">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Facility Analyzer
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                AI-powered risk prediction system
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="px-2.5 py-1 border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-5">
          <TabsList className="grid grid-cols-2 w-full h-11 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="single" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
              <Calculator className="h-4 w-4" />
              <span className="font-medium">Single</span>
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
              <Database className="h-4 w-4" />
              <span className="font-medium">Batch</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-3.5 mt-4">
            <div className="space-y-3.5">
              {/* Basic Information Section */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <div className="h-4 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
                  Basic Information
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="branch" className="text-xs font-medium">Branch</Label>
                      <Select value={facility.Branch} onValueChange={(v) => updateFacility("Branch", v)}>
                        <SelectTrigger className="h-9 bg-white dark:bg-slate-950">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="facility-type" className="text-xs font-medium">Facility Type</Label>
                      <Select
                        value={facility["Facility Type"]}
                        onValueChange={(v) => updateFacility("Facility Type", v)}
                      >
                        <SelectTrigger className="h-9 bg-white dark:bg-slate-950">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {facilityTypes.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="amount" className="text-xs font-medium">Facility Amount</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-medium">LKR</span>
                        <Input
                          id="amount"
                          type="number"
                          className="pl-10 h-9 bg-white dark:bg-slate-950"
                          value={facility.FacilityAmount}
                          onChange={(e) =>
                            updateFacility("FacilityAmount", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rate" className="text-xs font-medium">Effective Rate</Label>
                      <div className="relative">
                        <Input
                          id="rate"
                          type="number"
                          step="0.1"
                          className="pr-7 h-9 bg-white dark:bg-slate-950"
                          value={facility["Effective Rate"]}
                          onChange={(e) =>
                            updateFacility("Effective Rate", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-muted-foreground font-medium">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="age" className="text-xs font-medium">Age (months)</Label>
                      <Input
                        id="age"
                        type="number"
                        className="h-9 bg-white dark:bg-slate-950"
                        value={facility.Age}
                        onChange={(e) =>
                          updateFacility("Age", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="arrears-count" className="text-xs font-medium">Arrears Count</Label>
                      <Input
                        id="arrears-count"
                        type="number"
                        className="h-9 bg-white dark:bg-slate-950"
                        value={facility["No of Rental in arrears"]}
                        onChange={(e) =>
                          updateFacility("No of Rental in arrears", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrears & Financial Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <div className="h-5 w-1 bg-gradient-to-b from-amber-600 to-orange-600 rounded-full" />
                  Arrears Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Capital", key: "ArrearsCapital" },
                    { label: "Interest", key: "ArrearsInterest" },
                    { label: "VAT", key: "ArrearsVat" },
                    { label: "OD", key: "ArrearsOD" },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <Label className="text-xs font-medium">{item.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">LKR</span>
                        <Input
                          type="number"
                          className="pl-11 h-10 bg-white dark:bg-slate-950"
                          value={facility[item.key as keyof FacilityData] as number}
                          onChange={(e) =>
                            updateFacility(item.key as keyof FacilityData, parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Future Payments */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                  <div className="h-5 w-1 bg-gradient-to-b from-emerald-600 to-green-600 rounded-full" />
                  Future Payments
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Capital</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">LKR</span>
                      <Input
                        type="number"
                        className="pl-11 h-10 bg-white dark:bg-slate-950"
                        value={facility.FutureCapital}
                        onChange={(e) =>
                          updateFacility("FutureCapital", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Interest</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">LKR</span>
                      <Input
                        type="number"
                        className="pl-11 h-10 bg-white dark:bg-slate-950"
                        value={facility.FutureInterest}
                        onChange={(e) =>
                          updateFacility("FutureInterest", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Outstanding & Collection */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-100 dark:border-violet-900/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-violet-900 dark:text-violet-100">
                  <div className="h-5 w-1 bg-gradient-to-b from-violet-600 to-purple-600 rounded-full" />
                  Outstanding & Collection
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="net-outstanding" className="text-xs font-medium">NET Outstanding</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">LKR</span>
                      <Input
                        id="net-outstanding"
                        type="number"
                        className="pl-11 h-10 bg-white dark:bg-slate-950"
                        value={facility["NET-OUTSTANDING"]}
                        onChange={(e) =>
                          updateFacility("NET-OUTSTANDING", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Last Receipt</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">LKR</span>
                        <Input
                          type="number"
                          className="pl-11 h-10 bg-white dark:bg-slate-950"
                          value={facility["Last Receipt Paid Amount"]}
                          onChange={(e) =>
                            updateFacility("Last Receipt Paid Amount", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">CD Collection</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">LKR</span>
                        <Input
                          type="number"
                          className="pl-11 h-10 bg-white dark:bg-slate-950"
                          value={facility.CD_Collection_Rental}
                          onChange={(e) =>
                            updateFacility("CD_Collection_Rental", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Status & Metrics */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-100 dark:border-rose-900/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-rose-900 dark:text-rose-100">
                  <div className="h-5 w-1 bg-gradient-to-b from-rose-600 to-pink-600 rounded-full" />
                  Status & Metrics
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Status</Label>
                      <Select value={facility.Status} onValueChange={(v) => updateFacility("Status", v)}>
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">NPL Status</Label>
                      <Select
                        value={facility.NPLStatus}
                        onValueChange={(v) => updateFacility("NPLStatus", v)}
                      >
                        <SelectTrigger className="h-10 bg-white dark:bg-slate-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {nplStatuses.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="arrears-ratio" className="text-xs font-medium">Arrears Ratio</Label>
                      <Input
                        id="arrears-ratio"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="h-10 bg-white dark:bg-slate-950"
                        value={facility.Arrears_Ratio}
                        onChange={(e) =>
                          updateFacility("Arrears_Ratio", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="claimable-percentage" className="text-xs font-medium">Claimable %</Label>
                      <div className="relative">
                        <Input
                          id="claimable-percentage"
                          type="number"
                          min="0"
                          max="100"
                          className="pr-8 h-10 bg-white dark:bg-slate-950"
                          value={facility.ClaimablePercentage}
                          onChange={(e) =>
                            updateFacility("ClaimablePercentage", parseFloat(e.target.value) || 0)
                          }
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-medium">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Model Selection */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-100 dark:border-cyan-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">AI Model Selection</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose the prediction model for analysis</p>
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[200px] h-10 bg-white dark:bg-slate-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Random Forest">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Random Forest
                      </div>
                    </SelectItem>
                    <SelectItem value="XGBoost">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        XGBoost
                      </div>
                    </SelectItem>
                    <SelectItem value="CatBoost">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                        CatBoost
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing} 
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Analyze Facility
                  </>
                )}
              </Button>
              <Button 
                onClick={addFacility} 
                variant="outline" 
                className="flex-1 h-10 border-2 hover:bg-muted/50"
              >
                <Database className="mr-2 h-4 w-4" />
                Add to Batch
                <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/10">{facilities.length}</Badge>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-5 mt-5">
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border-2 border-dashed border-blue-200 dark:border-blue-900/30">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Batch Data Input</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paste JSON array of facility objects for bulk analysis
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium">JSON Data</Label>
                <Textarea
                  placeholder={`[\n  ${JSON.stringify(defaultFacility, null, 2).split('\n').slice(0, 5).join('\n')}\n  ...\n]`}
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  className="font-mono text-xs min-h-[200px] resize-y bg-white dark:bg-slate-950 border-2"
                />
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    <Database className="h-3 w-3 mr-1" />
                    {facilities.length} facilities loaded
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={clearFacilities}
                    variant="outline"
                    size="sm"
                    className="h-9"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                  </Button>
                  <Button
                    onClick={parseBulkData}
                    size="sm"
                    className="h-9 bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Parse Data
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Model Selection */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-100 dark:border-cyan-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">AI Model Selection</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose the prediction model for batch analysis</p>
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[200px] h-10 bg-white dark:bg-slate-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Random Forest">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Random Forest
                      </div>
                    </SelectItem>
                    <SelectItem value="XGBoost">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        XGBoost
                      </div>
                    </SelectItem>
                    <SelectItem value="CatBoost">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                        CatBoost
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing || facilities.length === 0} 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing {facilities.length} facilities...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Analyze Batch
                  <Badge className="ml-2 bg-white/20 text-white hover:bg-white/20">{facilities.length}</Badge>
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="bg-gradient-to-br from-muted/30 to-muted/50 pt-4 pb-4 border-t relative">
        <Alert className="w-full border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">AI Prediction Models</AlertTitle>
          <AlertDescription className="flex flex-wrap gap-2 mt-2">
            <Badge className={`${
              selectedModel === "Random Forest" 
                ? "bg-blue-600 text-white" 
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            } border-0`}>
              Random Forest
            </Badge>
            <Badge className={`${
              selectedModel === "XGBoost" 
                ? "bg-purple-600 text-white" 
                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            } border-0`}>
              XGBoost
            </Badge>
            <Badge className={`${
              selectedModel === "CatBoost" 
                ? "bg-indigo-600 text-white" 
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            } border-0`}>
              CatBoost
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto mt-1">
              Currently using: {selectedModel}
            </span>
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  );
}