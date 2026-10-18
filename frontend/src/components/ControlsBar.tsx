import React from "react";
import type { SystemStats, Density } from "../types/order";

interface ControlsBarProps {
  status: string;
  onSelectStatus: (status: string) => void;
  systemStats: SystemStats;
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: "createdAt" | "totalAmount" | "orderNumber";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: "createdAt" | "totalAmount" | "orderNumber", sortOrder: "asc" | "desc") => void;
  density: Density;
  onToggleDensity: () => void;
  onResetFilters: () => void;
  onOpenCreateDrawer: () => void;
}

const STATUS_TABS = [
  { key: "ALL", label: "All Orders" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" }
];

export const ControlsBar: React.FC<ControlsBarProps> = ({
  status,
  onSelectStatus,
  systemStats,
  search,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  density,
  onToggleDensity,
  onResetFilters,
  onOpenCreateDrawer
}) => {
  const currentSortKey = `${sortBy}_${sortOrder}`;

  const handleSortSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const [column, order] = val.split("_") as [
      "createdAt" | "totalAmount" | "orderNumber",
      "asc" | "desc"
    ];
    onSortChange(column, order);
  };

  const getStatusCount = (key: string) => {
    if (key === "ALL") {
      return (
        systemStats.statusCounts["ALL"] ??
        systemStats.totalSystemRecords ??
        0
      );
    }
    return systemStats.statusCounts[key] ?? 0;
  };

  return (
    <section className="console-header-card">
      <div className="controls-top-row">
        {/* Status Tabs with persistent SystemStats counts */}
        <div className="status-tab-list" role="tablist">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.key;
            const count = getStatusCount(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                className={`tab-btn ${isActive ? "active" : ""}`}
                onClick={() => onSelectStatus(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="tab-count">{count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        {/* Primary Action Button */}
        <div className="action-btn-group">
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenCreateDrawer}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Register New Order</span>
          </button>
        </div>
      </div>

      {/* Search, Sorting & Secondary Filters */}
      <div className="controls-bottom-row">
        <div className="search-input-wrapper">
          <svg
            className="search-icon-left"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="16.65" x2="16.65" y2="11"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by order ID, customer name, email..."
          />
          <span className="search-shortcut-badge">Search</span>
        </div>

        <div className="filter-options-group">
          {/* Sort Selector */}
          <select
            className="select-dropdown"
            value={currentSortKey}
            onChange={handleSortSelect}
          >
            <option value="createdAt_desc">Sort: Date (Newest first)</option>
            <option value="createdAt_asc">Sort: Date (Oldest first)</option>
            <option value="totalAmount_desc">Sort: Amount (High to Low)</option>
            <option value="totalAmount_asc">Sort: Amount (Low to High)</option>
            <option value="orderNumber_desc">Sort: Order # (Z to A)</option>
            <option value="orderNumber_asc">Sort: Order # (A to Z)</option>
          </select>

          {/* Density Toggle */}
          <button
            type="button"
            className="density-toggle"
            onClick={onToggleDensity}
            title="Toggle comfortable vs compact table density"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              <path d="M3 9h18"></path>
              <path d="M3 15h18"></path>
            </svg>
            <span style={{ textTransform: "capitalize" }}>Density: {density}</span>
          </button>

          {/* Reset Filters */}
          <button
            type="button"
            className="btn-secondary"
            onClick={onResetFilters}
            title="Reset filters and search query"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M8 16H3v5"></path>
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>
    </section>
  );
};
