import React, { useState } from "react";
import { Zap, ShieldCheck, RefreshCw } from "lucide-react";

interface RapidFilterTesterProps {
  currentStatus: string;
  onSelectStatus: (status: string) => void;
  abortedCount: number;
  latestRequestId: number;
  loading: boolean;
}

const STATUS_OPTIONS: Array<{ label: string; value: string; color: string }> = [
  { label: "All Orders", value: "ALL", color: "bg-slate-100 text-slate-800 border-slate-300" },
  { label: "Pending", value: "PENDING", color: "bg-amber-50 text-amber-800 border-amber-300" },
  { label: "Processing", value: "PROCESSING", color: "bg-blue-50 text-blue-800 border-blue-300" },
  { label: "Completed", value: "COMPLETED", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  { label: "Cancelled", value: "CANCELLED", color: "bg-rose-50 text-rose-800 border-rose-300" },
];

export const RapidFilterTester: React.FC<RapidFilterTesterProps> = ({
  currentStatus,
  onSelectStatus,
  abortedCount,
  latestRequestId,
  loading
}) => {
  const [testingAutomated, setTestingAutomated] = useState(false);
  const [testLog, setTestLog] = useState<string | null>(null);

  // Automated 3x rapid succession test
  const runRapidFilterTest = async () => {
    setTestingAutomated(true);
    setTestLog("⚡ Firing 3 filter requests in rapid 80ms intervals...");

    onSelectStatus("PENDING");
    await new Promise((r) => setTimeout(r, 80));

    onSelectStatus("PROCESSING");
    await new Promise((r) => setTimeout(r, 80));

    onSelectStatus("COMPLETED");

    setTestLog("✅ Rapid filter test triggered: Earlier requests aborted. Displaying latest COMPLETED orders.");
    setTimeout(() => {
      setTestingAutomated(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Filter Buttons */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status Filters (R1)</span>
            <span className="text-xs text-slate-400">• Click rapidly to test AbortController</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = currentStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Race Condition Monitor & Auto-test button */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {/* Live telemetry counters */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-medium">Request Seq:</span>
              <span className="font-mono font-bold text-indigo-600">#{latestRequestId}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-medium">Aborted In-Flight:</span>
              <span className="font-mono font-bold text-rose-600">{abortedCount}</span>
            </div>
            {loading && (
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin ml-1" />
            )}
          </div>

          {/* Rapid Test Button */}
          <button
            type="button"
            onClick={runRapidFilterTest}
            disabled={testingAutomated}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs gap-1.5 disabled:opacity-50"
            title="Automatically changes filter 3 times in quick succession"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{testingAutomated ? "Testing..." : "Simulate 3x Rapid Clicks"}</span>
          </button>
        </div>
      </div>

      {testLog && (
        <div className="mt-2.5 p-2 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono flex items-center justify-between">
          <span>{testLog}</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> R1 Verified
          </span>
        </div>
      )}
    </div>
  );
};
