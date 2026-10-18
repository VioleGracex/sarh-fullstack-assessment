import React from "react";
import type { SystemStats } from "../types/order";
import { useCountUp } from "../hooks/useCountUp";

interface StatCardsProps {
  systemStats: SystemStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ systemStats }) => {
  const pendingCount = systemStats.statusCounts["PENDING"] ?? 0;
  const completedCount = systemStats.statusCounts["COMPLETED"] ?? 0;

  // Animated Count-Up on refresh / state change
  const animatedTotalOrders = useCountUp(systemStats.totalSystemRecords, 1000);
  const animatedRevenue = useCountUp(systemStats.totalRevenue, 1200, 2);
  const animatedPending = useCountUp(pendingCount, 900);
  const animatedCompleted = useCountUp(completedCount, 900);

  return (
    <section className="stats-grid">
      {/* 1. Total Orders */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Total Orders</span>
          <svg
            className="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
            <path d="m3.3 7 8.7 5 8.7-5"></path>
            <path d="M12 22V12"></path>
          </svg>
        </div>
        <div className="stat-value">
          {animatedTotalOrders.toLocaleString()}
        </div>
        <div className="stat-subtext highlight">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
          <span>All registered orders</span>
        </div>
      </div>

      {/* 2. Total Revenue */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Total Revenue</span>
          <svg
            className="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="5" rx="2"></rect>
            <line x1="2" x2="22" y1="10" y2="10"></line>
          </svg>
        </div>
        <div className="stat-value">
          {animatedRevenue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}{" "}
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-tertiary)" }}>
            SAR
          </span>
        </div>
        <div className="stat-subtext">Aggregated system volume</div>
      </div>

      {/* 3. Pending Orders */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Pending Orders</span>
          <svg
            className="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="stat-value" style={{ color: "var(--badge-pending-text)" }}>
          {animatedPending.toLocaleString()}
        </div>
        <div className="stat-subtext">Requires agent review</div>
      </div>

      {/* 4. Completed */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Completed</span>
          <svg
            className="stat-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div className="stat-value" style={{ color: "var(--badge-completed-text)" }}>
          {animatedCompleted.toLocaleString()}
        </div>
        <div className="stat-subtext">Fulfilled & reconciled</div>
      </div>
    </section>
  );
};
