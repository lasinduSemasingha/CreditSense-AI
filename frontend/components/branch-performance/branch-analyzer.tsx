"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const defaultFacility: FacilityData = {
  Branch: "Colombo",
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
  Status: "Active",
  NPLStatus: "Performing",
  "Last Receipt Paid Amount": 25000,
  CD_Collection_Rental: 475000,
  ClaimablePercentage: 85,
  Arrears_Ratio: 0.15,
};

const branches = ["Colombo", "Galle", "Kandy", "Matara", "Jaffna", "Battaramulla"];
const facilityTypes = ["Motorcycle", "Auto", "Three Wheeler"];
const statuses = ["Active", "Inactive", "Default"];
const nplStatuses = ["Performing", "Non-Performing", "Watch List"];

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
  const [useMultiple, setUseMultiple] = useState(false);
  const [bulkData, setBulkData] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const updateFacility = (key: keyof FacilityData, value: any) => {
    setFacility((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addFacility = () => {
    setFacilities((prev) => [...prev, { ...facility }]);
    toast.success("Facility added to batch");
  };

  const clearFacilities = () => {
    setFacilities([defaultFacility]);
    setFacility(defaultFacility);
    setBulkData("");
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setIsLoading(true);

      const dataToAnalyze = useMultiple ? facilities : [facility];

      if (dataToAnalyze.length === 0) {
        toast.error("Please add at least one facility");
        return;
      }

      const predictions = await Promise.all(
        dataToAnalyze.map((fac) =>
          fetch("/api/predict-facility", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(fac),
          })
            .then((res) => res.json())
            .then((data) => ({
              ...fac,
              prediction: data.prediction,
              confidence: data.confidence,
              modelUsed: data.model_used,
            }))
        )
      );

      onAnalyze(predictions);
      toast.success(`Analyzed ${predictions.length} facilities`);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze facilities");
    } finally {
      setAnalyzing(false);
      setIsLoading(false);
    }
  };

  const parseBulkData = () => {
    try {
      const parsed = JSON.parse(`[${bulkData}]`);
      setFacilities(parsed);
      toast.success(`Loaded ${parsed.length} facilities`);
    } catch (error) {
      toast.error("Invalid JSON format");
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Analysis Input</h2>
        <p className="text-sm text-muted-foreground">
          Enter facility data for prediction
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={!useMultiple ? "default" : "outline"}
          onClick={() => setUseMultiple(false)}
          className="flex-1"
        >
          Single
        </Button>
        <Button
          variant={useMultiple ? "default" : "outline"}
          onClick={() => setUseMultiple(true)}
          className="flex-1"
        >
          Batch
        </Button>
      </div>

      {/* Single Facility Input */}
      {!useMultiple ? (
        <div className="space-y-4">
          {/* Branch Info */}
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={facility.Branch} onValueChange={(v) => updateFacility("Branch", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Facility Type</Label>
            <Select
              value={facility["Facility Type"]}
              onValueChange={(v) => updateFacility("Facility Type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {facilityTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Facility Amount</Label>
              <Input
                type="number"
                value={facility.FacilityAmount}
                onChange={(e) =>
                  updateFacility("FacilityAmount", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Effective Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={facility["Effective Rate"]}
                onChange={(e) =>
                  updateFacility("Effective Rate", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Age (months)</Label>
              <Input
                type="number"
                value={facility.Age}
                onChange={(e) =>
                  updateFacility("Age", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Arrears Count</Label>
              <Input
                type="number"
                value={facility["No of Rental in arrears"]}
                onChange={(e) =>
                  updateFacility("No of Rental in arrears", parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          {/* Arrears Details */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Arrears Breakdown</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Capital"
                type="number"
                value={facility.ArrearsCapital}
                onChange={(e) =>
                  updateFacility("ArrearsCapital", parseFloat(e.target.value))
                }
              />
              <Input
                placeholder="Interest"
                type="number"
                value={facility.ArrearsInterest}
                onChange={(e) =>
                  updateFacility("ArrearsInterest", parseFloat(e.target.value))
                }
              />
              <Input
                placeholder="VAT"
                type="number"
                value={facility.ArrearsVat}
                onChange={(e) =>
                  updateFacility("ArrearsVat", parseFloat(e.target.value))
                }
              />
              <Input
                placeholder="OD"
                type="number"
                value={facility.ArrearsOD}
                onChange={(e) =>
                  updateFacility("ArrearsOD", parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          {/* Future Payments */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Future Payments</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Capital"
                type="number"
                value={facility.FutureCapital}
                onChange={(e) =>
                  updateFacility("FutureCapital", parseFloat(e.target.value))
                }
              />
              <Input
                placeholder="Interest"
                type="number"
                value={facility.FutureInterest}
                onChange={(e) =>
                  updateFacility("FutureInterest", parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          {/* Outstanding & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>NET Outstanding</Label>
              <Input
                type="number"
                value={facility["NET-OUTSTANDING"]}
                onChange={(e) =>
                  updateFacility("NET-OUTSTANDING", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Last Receipt Paid</Label>
              <Input
                type="number"
                value={facility["Last Receipt Paid Amount"]}
                onChange={(e) =>
                  updateFacility(
                    "Last Receipt Paid Amount",
                    parseFloat(e.target.value)
                  )
                }
              />
            </div>
          </div>

          {/* Status Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={facility.Status} onValueChange={(v) => updateFacility("Status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>NPL Status</Label>
              <Select
                value={facility.NPLStatus}
                onValueChange={(v) => updateFacility("NPLStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nplStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collection & Claims */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CD Collection Rental</Label>
              <Input
                type="number"
                value={facility.CD_Collection_Rental}
                onChange={(e) =>
                  updateFacility("CD_Collection_Rental", parseFloat(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Claimable % </Label>
              <Input
                type="number"
                value={facility.ClaimablePercentage}
                onChange={(e) =>
                  updateFacility("ClaimablePercentage", parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arrears Ratio</Label>
            <Input
              type="number"
              step="0.01"
              value={facility.Arrears_Ratio}
              onChange={(e) =>
                updateFacility("Arrears_Ratio", parseFloat(e.target.value))
              }
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={analyzing} className="flex-1">
              {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Facility
            </Button>
            <Button onClick={addFacility} variant="outline" className="flex-1">
              + Add to Batch
            </Button>
          </div>
        </div>
      ) : (
        /* Batch Input */
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>JSON Data (comma-separated objects)</Label>
            <Textarea
              placeholder={`${JSON.stringify(defaultFacility)},\n${JSON.stringify(defaultFacility)}`}
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              className="font-mono text-xs min-h-[200px]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={parseBulkData} variant="outline" className="flex-1">
              Parse & Load
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing || facilities.length === 0} className="flex-1">
              {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze ({facilities.length})
            </Button>
          </div>

          {facilities.length > 0 && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Loaded {facilities.length} facilities</p>
              <Button onClick={clearFacilities} variant="ghost" size="sm">
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg flex gap-2 text-sm text-blue-900 dark:text-blue-100">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Prediction Models Available:</p>
          <p>Random Forest, XGBoost, CatBoost</p>
        </div>
      </div>
    </Card>
  );
}
