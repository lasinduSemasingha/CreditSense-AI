"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/utils/auth-client";
import { AppHeader } from "@/components/app-header";
import { BranchPerformanceAnalyzer } from "@/components/branch-performance/branch-analyzer";
import { PerformanceResults } from "@/components/branch-performance/performance-results";
import { BarChart3, TrendingUp, Activity, Loader2, Lock } from "lucide-react";

export default function BranchPerformancePage() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (isCheckingAuth && session !== undefined) {
      if (!session) {
        router.push("/login");
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [session, isCheckingAuth, router]);

  if (isCheckingAuth || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950 flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950 pt-14">
      <AppHeader />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 blur-3xl -z-10" />
            <div className="space-y-4 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Branch Performance Analytics
                  </h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    AI-powered facility loan risk prediction and performance analysis
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Live Predictions</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Multi-Model Analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid - Balanced Layout */}
          <div className="grid lg:grid-cols-2 gap-6 xl:gap-8">
            {/* Input Form - Left Column */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <BranchPerformanceAnalyzer
                onAnalyze={setResults}
                setIsLoading={setIsLoading}
              />
            </div>

            {/* Results - Right Column */}
            <div>
              <PerformanceResults results={results} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
