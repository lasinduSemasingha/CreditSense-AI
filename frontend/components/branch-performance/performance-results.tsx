"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";

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

export function PerformanceResults({
  results,
  isLoading,
}: PerformanceResultsProps) {
  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const good = results.filter((r) => r.prediction === "Good").length;
    const bad = results.filter((r) => r.prediction === "Bad").length;
    const avgConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    const byBranch = results.reduce(
      (acc, r) => {
        if (!acc[r.Branch]) {
          acc[r.Branch] = { total: 0, good: 0, bad: 0, avgConfidence: 0 };
        }
        acc[r.Branch].total += 1;
        if (r.prediction === "Good") acc[r.Branch].good += 1;
        else acc[r.Branch].bad += 1;
        acc[r.Branch].avgConfidence += r.confidence;
        return acc;
      },
      {} as Record<
        string,
        { total: number; good: number; bad: number; avgConfidence: number }
      >
    );

    // Calculate avg confidence per branch
    Object.keys(byBranch).forEach((branch) => {
      byBranch[branch].avgConfidence /= byBranch[branch].total;
    });

    return { good, bad, avgConfidence, byBranch };
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
      <Card className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 animate-spin">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
          <p className="text-muted-foreground">Analyzing facilities...</p>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold text-lg mb-1">No Results Yet</h3>
            <p className="text-muted-foreground">
              Add facility data and click "Analyze" to see predictions
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Total Facilities</p>
            <p className="text-3xl font-bold">{stats.good + stats.bad}</p>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Good Status</p>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.good}
              <span className="text-lg text-muted-foreground ml-2">
                ({Math.round((stats.good / (stats.good + stats.bad)) * 100)}%)
              </span>
            </p>
          </Card>
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-sm text-muted-foreground">Bad Status</p>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {stats.bad}
              <span className="text-lg text-muted-foreground ml-2">
                ({Math.round((stats.bad / (stats.good + stats.bad)) * 100)}%)
              </span>
            </p>
          </Card>
        </div>
      )}

      {/* Branch Summary */}
      {stats && Object.keys(stats.byBranch).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Performance by Branch</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.byBranch).map(([branch, data]) => (
              <div key={branch} className="p-3 border rounded-lg space-y-1">
                <p className="font-semibold text-sm">{branch}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {data.good}
                    <span className="text-green-600 font-semibold ml-1">✓</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {data.bad}
                    <span className="text-red-600 font-semibold ml-1">✗</span>
                  </span>
                  <span className="text-xs ml-auto">
                    Confidence:{" "}
                    <span className="font-semibold">
                      {(data.avgConfidence * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Results Table */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Detailed Analysis</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prediction</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>NPL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{result.Branch}</TableCell>
                  <TableCell className="text-sm">
                    {result["Facility Type"]}
                  </TableCell>
                  <TableCell className="text-sm">
                    {(result.FacilityAmount / 1000).toFixed(0)}k
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{result.Status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPredictionColor(result.prediction)}>
                      {result.prediction}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={getConfidenceColor(result.confidence)}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{result.NPLStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
