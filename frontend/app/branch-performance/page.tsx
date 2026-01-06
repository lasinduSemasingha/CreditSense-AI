"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { BranchPerformanceAnalyzer } from "@/components/branch-performance/branch-analyzer";
import { PerformanceResults } from "@/components/branch-performance/performance-results";
import { Card } from "@/components/ui/card";

export default function BranchPerformancePage() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background pt-14">
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Branch Performance Analysis</h1>
            <p className="text-muted-foreground">
              Analyze facility loan status and risk predictions across branches
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-1">
              <BranchPerformanceAnalyzer
                onAnalyze={setResults}
                setIsLoading={setIsLoading}
              />
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <PerformanceResults results={results} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
