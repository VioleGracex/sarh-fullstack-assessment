import React from "react";
import type { SystemStats } from "../types/order";
import { useCountUp } from "../hooks/useCountUp";
import {
  PackageBoxIcon,
  TrendingUpIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon
} from "./icons";

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
          <PackageBoxIcon className="stat-icon" />
        </div>
        <div className="stat-value">
          {animatedTotalOrders.toLocaleString()}
        </div>
        <div className="stat-subtext highlight">
          <TrendingUpIcon size={12} />
          <span>All registered orders</span>
        </div>
      </div>

      {/* 2. Total Revenue */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Total Revenue</span>
          <CreditCardIcon className="stat-icon" />
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
          <ClockIcon className="stat-icon" />
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
          <CheckCircleIcon className="stat-icon" />
        </div>
        <div className="stat-value" style={{ color: "var(--badge-completed-text)" }}>
          {animatedCompleted.toLocaleString()}
        </div>
        <div className="stat-subtext">Fulfilled & reconciled</div>
      </div>
    </section>
  );
};
