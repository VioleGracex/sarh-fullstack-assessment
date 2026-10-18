import React, { useState, useEffect, useRef } from "react";
import { X, RefreshCw, AlertCircle, Ban } from "lucide-react";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatsData {
  totalsByStatus: Record<string, number>;
  totalRevenue: number;
  averageOrderValue: number;
  timestamp: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);

  const fetchStats = async () => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setSecondsElapsed(0);

    // Elapsed timer
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    try {
      const res = await fetch("/api/orders/stats", { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Failed to load stats: HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
      clearInterval(timerRef.current);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stats request was aborted by user or navigation.");
        return;
      }
      setError(err.message || "Failed to load operations metrics");
      setLoading(false);
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    fetchStats();

    return () => {
      // Abort when user navigates away or modal unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearInterval(timerRef.current);
    };
  }, [retryCount]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    clearInterval(timerRef.current);
    setError("Request was cancelled by user.");
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Slow Stats API (Optional O1)</h2>
            <p className="text-xs text-slate-500">Deliberately slow 3.5s response with non-blocking UI and cancellation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-slate-800">Calculating aggregates across 50,000+ orders...</p>
              <p className="text-xs text-slate-500 mt-1">Elapsed: {secondsElapsed}s (Simulated server delay: 3.5s)</p>

              <button
                type="button"
                onClick={handleCancel}
                className="mt-4 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1.5 transition"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Request (AbortController)</span>
              </button>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-rose-800">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry (One Retry Allowed)</span>
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Total Revenue</span>
                  <div className="text-lg font-bold font-mono text-emerald-600">
                    ${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Average Order</span>
                  <div className="text-lg font-bold font-mono text-indigo-600">
                    ${data.averageOrderValue.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Orders by Status</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-amber-800 font-semibold block">Pending</span>
                    <span className="font-mono font-bold text-slate-800">{data.totalsByStatus.PENDING?.toLocaleString() || 0}</span>
                  </div>
                  <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg">
                    <span className="text-sky-800 font-semibold block">Processing</span>
                    <span className="font-mono font-bold text-slate-800">{data.totalsByStatus.PROCESSING?.toLocaleString() || 0}</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-emerald-800 font-semibold block">Completed</span>
                    <span className="font-mono font-bold text-slate-800">{data.totalsByStatus.COMPLETED?.toLocaleString() || 0}</span>
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                    <span className="text-rose-800 font-semibold block">Cancelled</span>
                    <span className="font-mono font-bold text-slate-800">{data.totalsByStatus.CANCELLED?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Stats</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
