import React from "react";
import type { SystemStats, Density } from "../types/order";
import { PlusIcon, SearchIcon, DensityIcon, ResetIcon, SpinLoaderIcon } from "./icons";

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
  totalFilteredRecords?: number;
  loading?: boolean;
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
  onOpenCreateDrawer,
  totalFilteredRecords,
  loading
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
            <PlusIcon size={16} />
            <span>Register New Order</span>
          </button>
        </div>
      </div>

      {/* Search, Sorting & Secondary Filters */}
      <div className="controls-bottom-row">
        <div className="search-input-wrapper">
          <SearchIcon className="search-icon-left" />
          <input
            type="text"
            className="search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by order ID, customer name, email..."
            style={{ paddingRight: search.trim() ? "145px" : "60px" }}
            aria-label="Search orders"
          />
          {search.trim() ? (
            <div className="search-active-controls">
              <span className={`search-count-badge ${loading ? "loading" : "active"}`}>
                {loading ? (
                  <>
                    <SpinLoaderIcon size={11} className="spin-animation" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>
                    {totalFilteredRecords !== undefined
                      ? `${totalFilteredRecords.toLocaleString()} ${
                          totalFilteredRecords === 1 ? "result" : "results"
                        }`
                      : "Active"}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="btn-clear-search-icon"
                onClick={() => onSearchChange("")}
                title="Clear search query"
                aria-label="Clear search"
              >
                ✕
              </button>
            </div>
          ) : (
            <span className="search-shortcut-badge">Search</span>
          )}
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
            <DensityIcon size={14} />
            <span style={{ textTransform: "capitalize" }}>Density: {density}</span>
          </button>

          {/* Reset Filters */}
          <button
            type="button"
            className="btn-secondary"
            onClick={onResetFilters}
            title="Reset filters and search query"
          >
            <ResetIcon size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Active Search Results Telemetry Banner */}
      {search.trim() !== "" && (
        <div className="search-results-summary-bar">
          <div className="search-summary-text">
            <SearchIcon size={14} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
            <span>
              Found <strong>{totalFilteredRecords !== undefined ? totalFilteredRecords.toLocaleString() : 0}</strong> {totalFilteredRecords === 1 ? "order" : "orders"} matching <strong>"{search}"</strong>
              {status !== "ALL" && <span> under <strong>{status}</strong> status</span>}
              {" "}out of <strong>{systemStats.totalSystemRecords.toLocaleString()}</strong> registered
            </span>
          </div>
          <button
            type="button"
            className="btn-clear-search-pill"
            onClick={() => onSearchChange("")}
            title="Clear search query"
          >
            <span>Clear search</span>
            <span style={{ fontSize: "10px", marginLeft: "2px" }}>✕</span>
          </button>
        </div>
      )}
    </section>
  );
};
