"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Award,
  Target,
  DollarSign,
  CheckCircle2,
  XCircle,
  Activity,
  BarChart3
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PredictionResult {
  Branch: string;
  "Facility Type": string;
  FacilityAmount: number;
  Status: string;
  NPLStatus: string;
  prediction: string;
  confidence: number;
  modelUsed: string;
}

interface PerformanceResultsProps {
  results: PredictionResult[];
  isLoading: boolean;
}

// Normalize backend labels ("Good", "Poor", "Bad", "At Risk") into a simple bucket
const categorizePrediction = (prediction: string | null | undefined) => {
  const normalized = (prediction ?? "").toString().trim().toLowerCase();

  if (["good", "performing", "healthy"].includes(normalized)) return "good" as const;
  if (["bad", "poor", "at risk", "risk", "risky"].includes(normalized)) return "risk" as const;

  return "unknown" as const;
};

export function PerformanceResults({
  results,
  isLoading,
}: PerformanceResultsProps) {
  const stats = useMemo(() => {
    if (results.length === 0) return null;

    let good = 0;
    let risk = 0;
    let confidenceTotal = 0;

    const byBranch = results.reduce(
      (acc, r) => {
        if (!acc[r.Branch]) {
          acc[r.Branch] = { total: 0, good: 0, risk: 0, avgConfidence: 0 };
        }
        acc[r.Branch].total += 1;
        const bucket = categorizePrediction(r.prediction);
        if (bucket === "good") {
          good += 1;
          acc[r.Branch].good += 1;
        } else {
          // treat any non-good outcome as risk to keep summary cards honest
          risk += 1;
          acc[r.Branch].risk += 1;
        }
        confidenceTotal += r.confidence;
        acc[r.Branch].avgConfidence += r.confidence;
        return acc;
      },
      {} as Record<
        string,
        { total: number; good: number; risk: number; avgConfidence: number }
      >
    );

    // Calculate avg confidence per branch
    Object.keys(byBranch).forEach((branch) => {
      byBranch[branch].avgConfidence /= byBranch[branch].total;
    });

    const total = good + risk || 1; // avoid division by zero for percentages
    const avgConfidence = confidenceTotal / results.length;

    return { good, risk, total, avgConfidence, byBranch };
  }, [results]);

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case "Good":
        return "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100";
      case "Bad":
        return "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <CardContent className="p-12 flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-6">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Analyzing Facilities</h3>
              <p className="text-muted-foreground">Processing risk predictions with AI models...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <CardContent className="p-12 flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-6">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-2xl" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <BarChart3 className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Ready to Analyze</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Enter facility data in the form and click "Analyze" to view AI-powered predictions and performance insights
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Multi-model</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Real-time</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span>High accuracy</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Facilities */}
          <Card className="border-0 shadow-lg overflow-hidden relative group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-transparent" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Total Facilities
                </CardDescription>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Analyzed in this batch</p>
            </CardContent>
          </Card>

          {/* Good Status */}
          <Card className="border-0 shadow-lg overflow-hidden relative group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-green-500/5 to-transparent" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Good Performance
                </CardDescription>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  {stats.good}
                </p>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                  {Math.round((stats.good / stats.total) * 100)}%
                </Badge>
              </div>
              <Progress 
                value={(stats.good / stats.total) * 100} 
                className="h-2 mt-3 bg-green-100 dark:bg-green-950"
              />
            </CardContent>
          </Card>

          {/* Bad Status */}
          <Card className="border-0 shadow-lg overflow-hidden relative group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-red-500/5 to-transparent" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  At Risk
                </CardDescription>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  {stats.risk}
                </p>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                  {Math.round((stats.risk / stats.total) * 100)}%
                </Badge>
              </div>
              <Progress 
                value={(stats.risk / stats.total) * 100} 
                className="h-2 mt-3 bg-red-100 dark:bg-red-950"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch Performance Breakdown */}
      {stats && Object.keys(stats.byBranch).length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Branch Performance Overview</CardTitle>
                <CardDescription>Performance metrics across all branches</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.byBranch).map(([branch, data]) => {
                const successRate = (data.good / data.total) * 100;
                return (
                  <div
                    key={branch}
                    className="p-4 rounded-xl border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg">{branch}</h4>
                        <p className="text-xs text-muted-foreground">
                          {data.total} {data.total === 1 ? 'facility' : 'facilities'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          successRate >= 75
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
                            : successRate >= 50
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400"
                        }
                      >
                        {successRate.toFixed(0)}%
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Good</span>
                        </div>
                        <span className="font-semibold text-green-600">{data.good}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-muted-foreground">At Risk</span>
                        </div>
                        <span className="font-semibold text-red-600">{data.risk}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          <span className="text-muted-foreground">Confidence</span>
                        </div>
                        <span className="font-semibold text-blue-600">
                          {(data.avgConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <Progress value={successRate} className="h-2 mt-3" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Detailed Analysis Report</CardTitle>
              <CardDescription>Individual facility predictions and risk assessment</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Branch</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Prediction</TableHead>
                    <TableHead className="font-semibold">Confidence</TableHead>
                    <TableHead className="font-semibold">NPL Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, idx) => (
                    <TableRow 
                      key={idx} 
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {result.Branch}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {result["Facility Type"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {(result.FacilityAmount / 1000).toFixed(0)}k
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            result.Status === "Active"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {result.Status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const bucket = categorizePrediction(result.prediction);
                          const isGood = bucket === "good";
                          const displayLabel = result.prediction || (isGood ? "Good" : "At Risk");

                          return (
                            <Badge
                              className={
                                isGood
                                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 border-0"
                                  : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100 border-0"
                              }
                            >
                              {isGood ? (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {displayLabel}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={result.confidence * 100}
                            className="h-2 w-16"
                          />
                          <span
                            className={`font-semibold text-sm ${getConfidenceColor(
                              result.confidence
                            )}`}
                          >
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            result.NPLStatus === "Performing"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
                              : result.NPLStatus === "Non-Performing"
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400"
                          }
                        >
                          {result.NPLStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
