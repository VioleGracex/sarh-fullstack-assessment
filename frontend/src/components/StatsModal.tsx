import React, { useState, useEffect, useRef, useCallback } from "react";

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
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);

  const fetchStats = useCallback(async () => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setSecondsElapsed(0);

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
        return;
      }
      setError(err.message || "Failed to load operations metrics");
      setLoading(false);
      clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    fetchStats();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearInterval(timerRef.current);
    };
  }, [isOpen, retryCount, fetchStats]);

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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(2px)",
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          maxWidth: "520px",
          width: "100%",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-subtle)"
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              Slow Stats Analytics (O1)
            </h2>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Live server aggregation across 50,000+ orders
            </p>
          </div>
          <button
            type="button"
            className="btn-close-drawer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "28px 16px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid var(--accent-primary)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  margin: "0 auto 12px auto",
                  animation: "spin 0.8s linear infinite"
                }}
              />
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                Computing analytics across system records...
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                Elapsed: {secondsElapsed}s (Simulated server delay: 3.5s)
              </p>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                style={{ marginTop: "16px", fontSize: "11px", color: "#ef4444", borderColor: "#fca5a5" }}
              >
                Cancel Request (AbortController)
              </button>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                textAlign: "center"
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#ef4444" }}>{error}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRetry}
                style={{ marginTop: "12px", fontSize: "12px" }}
              >
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)"
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                    Total Revenue
                  </span>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      fontFamily: "ui-monospace, monospace",
                      color: "var(--text-primary)",
                      marginTop: "4px"
                    }}
                  >
                    {data.totalRevenue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{" "}
                    SAR
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)"
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                    Average Order
                  </span>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      fontFamily: "ui-monospace, monospace",
                      color: "var(--accent-text)",
                      marginTop: "4px"
                    }}
                  >
                    {data.averageOrderValue.toFixed(2)} SAR
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
                  Orders by Status
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", textAlign: "center", fontSize: "11px" }}>
                  <div className="status-badge pending" style={{ flexDirection: "column", padding: "6px 4px", borderRadius: "var(--radius-sm)" }}>
                    <span style={{ fontSize: "10px" }}>Pending</span>
                    <strong style={{ fontSize: "13px" }}>{data.totalsByStatus.PENDING?.toLocaleString() || 0}</strong>
                  </div>
                  <div className="status-badge processing" style={{ flexDirection: "column", padding: "6px 4px", borderRadius: "var(--radius-sm)" }}>
                    <span style={{ fontSize: "10px" }}>Processing</span>
                    <strong style={{ fontSize: "13px" }}>{data.totalsByStatus.PROCESSING?.toLocaleString() || 0}</strong>
                  </div>
                  <div className="status-badge completed" style={{ flexDirection: "column", padding: "6px 4px", borderRadius: "var(--radius-sm)" }}>
                    <span style={{ fontSize: "10px" }}>Completed</span>
                    <strong style={{ fontSize: "13px" }}>{data.totalsByStatus.COMPLETED?.toLocaleString() || 0}</strong>
                  </div>
                  <div className="status-badge cancelled" style={{ flexDirection: "column", padding: "6px 4px", borderRadius: "var(--radius-sm)" }}>
                    <span style={{ fontSize: "10px" }}>Cancelled</span>
                    <strong style={{ fontSize: "13px" }}>{data.totalsByStatus.CANCELLED?.toLocaleString() || 0}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRetry}
                  style={{ fontSize: "11px" }}
                >
                  Refresh Analytics
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
