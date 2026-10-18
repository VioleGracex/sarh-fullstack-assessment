import React, { useState } from "react";
import type { Order, PaginationMeta, User, OrderStatus } from "../types/order";
import {
  SortIndicatorIcon,
  CheckIcon,
  ClockIcon,
  SpinLoaderIcon,
  XCircleIcon,
  ExportCsvIcon,
  CopyIcon,
  TrashIcon,
  CloseIcon,
  SearchIcon,
  ViewEyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "./icons";

interface OrdersTableProps {
  orders: Order[];
  pagination: PaginationMeta;
  systemTotal: number;
  loading: boolean;
  sortBy: "createdAt" | "totalAmount" | "orderNumber";
  sortOrder: "asc" | "desc";
  currentUser: User | null;
  selectedOrderIds: string[];
  onToggleSelectOrder: (orderId: string) => void;
  onToggleSelectAllPage: () => void;
  onBulkUpdateStatus: (status: OrderStatus) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onExportSelectedCsv: () => void;
  onCopySelectedIds: () => void;
  onSortToggle: (column: "createdAt" | "totalAmount" | "orderNumber") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string, orderNumber: string) => void;
  onCopyText: (text: string) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  pagination,
  systemTotal,
  loading,
  sortBy,
  sortOrder,
  currentUser,
  selectedOrderIds,
  onToggleSelectOrder,
  onToggleSelectAllPage,
  onBulkUpdateStatus,
  onBulkDelete,
  onClearSelection,
  onExportSelectedCsv,
  onCopySelectedIds,
  onSortToggle,
  onPageChange,
  onPageSizeChange,
  onViewOrder,
  onDeleteOrder,
  onCopyText
}) => {
  const renderSortIndicator = (column: "createdAt" | "totalAmount" | "orderNumber") => {
    const isCurrent = sortBy === column;
    return (
      <SortIndicatorIcon
        size={13}
        style={{
          opacity: isCurrent ? 1 : 0.35,
          color: isCurrent ? "var(--accent-text)" : "currentColor",
          transform: isCurrent && sortOrder === "asc" ? "rotate(180deg)" : "none",
          transition: "transform 150ms ease"
        }}
      />
    );
  };

  const getStatusIconSvg = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
        return <CheckIcon size={10} strokeWidth={3} />;
      case "PENDING":
        return <ClockIcon size={10} strokeWidth={2.5} />;
      case "PROCESSING":
        return <SpinLoaderIcon size={10} strokeWidth={2.5} />;
      case "CANCELLED":
        return <XCircleIcon size={10} strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const [jumpPageInput, setJumpPageInput] = useState<string>("");

  // Pagination bounds
  const totalFilteredRecords = pagination.totalRecords;
  const startItem = totalFilteredRecords === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, totalFilteredRecords);
  const totalPages = Math.max(1, pagination.totalPages || Math.ceil(totalFilteredRecords / pagination.pageSize));

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpPageInput("");
    }
  };

  const renderPaginationButtons = () => {
    const pages: (number | string)[] = [];
    const current = pagination.page;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (typeof p === "string") {
        return (
          <span
            key={`ellipsis-${idx}`}
            style={{
              padding: "0 6px",
              color: "var(--text-tertiary)",
              fontWeight: 700,
              fontSize: "14px"
            }}
          >
            ···
          </span>
        );
      }
      return (
        <button
          key={`page-${p}`}
          type="button"
          className={`page-btn ${p === current ? "active" : ""}`}
          onClick={() => onPageChange(p)}
          style={{
            minWidth: p > 999 ? "54px" : "38px",
            height: "34px",
            fontSize: "12px",
            fontWeight: p === current ? 700 : 600
          }}
        >
          {p.toLocaleString()}
        </button>
      );
    });
  };

  const isAllSelectedOnPage = orders.length > 0 && orders.every((o) => selectedOrderIds.includes(o.id));
  const isSomeSelectedOnPage = orders.some((o) => selectedOrderIds.includes(o.id));

  return (
    <section className="table-container">
      {/* Floating / Docked Bulk Actions Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span className="bulk-badge">{selectedOrderIds.length}</span>
            <span className="bulk-label">
              {selectedOrderIds.length === 1 ? "1 order selected" : `${selectedOrderIds.length} orders selected`}
            </span>
          </div>

          <div className="bulk-actions-group">
            <div className="bulk-status-dropdown-wrapper">
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 600 }}>Set Status:</span>
              <button
                type="button"
                className="btn-bulk-action"
                onClick={() => onBulkUpdateStatus("PROCESSING")}
                title="Mark selected orders as Processing"
              >
                Processing
              </button>
              <button
                type="button"
                className="btn-bulk-action"
                onClick={() => onBulkUpdateStatus("COMPLETED")}
                title="Mark selected orders as Completed"
              >
                Completed
              </button>
              <button
                type="button"
                className="btn-bulk-action"
                onClick={() => onBulkUpdateStatus("CANCELLED")}
                title="Mark selected orders as Cancelled"
              >
                Cancelled
              </button>
            </div>

            <div className="bulk-divider" />

            <button
              type="button"
              className="btn-bulk-action"
              onClick={onExportSelectedCsv}
              title="Export selected orders as CSV"
            >
              <ExportCsvIcon size={13} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="btn-bulk-action"
              onClick={onCopySelectedIds}
              title="Copy selected Order Numbers to clipboard"
            >
              <CopyIcon size={13} />
              <span>Copy IDs</span>
            </button>

            {currentUser?.role === "ADMIN" && (
              <>
                <div className="bulk-divider" />
                <button
                  type="button"
                  className="btn-bulk-action delete"
                  onClick={onBulkDelete}
                  title="Admin Delete Selected Orders"
                >
                  <TrashIcon size={13} />
                  <span>Delete ({selectedOrderIds.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-bulk-clear"
              onClick={onClearSelection}
              title="Clear selection"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="orders-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  aria-label="Select all orders on this page"
                  checked={isAllSelectedOnPage}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = isSomeSelectedOnPage && !isAllSelectedOnPage;
                    }
                  }}
                  onChange={onToggleSelectAllPage}
                />
              </th>
              <th
                className="sortable"
                onClick={() => onSortToggle("orderNumber")}
                style={{ width: "170px" }}
              >
                <div className="th-content">
                  <span>Order ID</span>
                  {renderSortIndicator("orderNumber")}
                </div>
              </th>
              <th>
                <div className="th-content">
                  <span>Customer Details</span>
                </div>
              </th>
              <th>
                <div className="th-content">
                  <span>Line Items</span>
                </div>
              </th>
              <th className="sortable" onClick={() => onSortToggle("createdAt")}>
                <div className="th-content">
                  <span>Created At</span>
                  {renderSortIndicator("createdAt")}
                </div>
              </th>
              <th>
                <div className="th-content">
                  <span>Status</span>
                </div>
              </th>
              <th
                className="sortable"
                onClick={() => onSortToggle("totalAmount")}
                style={{ textAlign: "right" }}
              >
                <div className="th-content" style={{ justifyContent: "flex-end" }}>
                  <span>Total Amount</span>
                  {renderSortIndicator("totalAmount")}
                </div>
              </th>
              <th style={{ width: "120px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-tertiary)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <div
                      className="spinner-clockwise"
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "3px solid var(--border-subtle)",
                        borderTopColor: "var(--accent-primary)",
                        borderRadius: "50%",
                        animation: "spin 0.85s linear infinite",
                        margin: 0
                      }}
                    />
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Loading orders...
                    </div>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-tertiary)" }}>
                  <SearchIcon
                    size={36}
                    strokeWidth={1.5}
                    style={{ margin: "0 auto 10px auto", opacity: 0.6 }}
                  />
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    No orders match your filter criteria
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    Try searching with a different order ID, customer name, or reset the filters.
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const itemsCount = order.items?.length || 0;
                const itemsSummary =
                  order.items && order.items.length > 0
                    ? `${itemsCount} ${itemsCount === 1 ? "item" : "items"} · ${order.items
                        .map((i) => i.productName)
                        .slice(0, 2)
                        .join(", ")}${order.items.length > 2 ? "..." : ""}`
                    : "No items";

                return (
                  <tr key={order.id} className={selectedOrderIds.includes(order.id) ? "selected-row" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        aria-label={`Select order ${order.orderNumber}`}
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => onToggleSelectOrder(order.id)}
                      />
                    </td>
                    <td>
                      <div className="order-number-cell">
                        <span>{order.orderNumber}</span>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => onCopyText(order.orderNumber)}
                          title="Copy Order ID"
                        >
                          <CopyIcon size={12} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="customer-info-box">
                        <span className="customer-name">{order.customerName}</span>
                        <span className="customer-email">{order.customerEmail}</span>
                      </div>
                    </td>
                    <td>
                      <span className="items-pill" title={order.items?.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}>
                        {itemsSummary}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(order.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {getStatusIconSvg(order.status)}
                        <span>{order.status}</span>
                      </span>
                    </td>
                    <td className="amount-cell">
                      {order.totalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                      <span className="amount-currency">SAR</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn-row-action"
                          onClick={() => onViewOrder(order)}
                          title="Inspect Order Details"
                        >
                          <ViewEyeIcon size={13} />
                          <span>View</span>
                        </button>

                        {currentUser?.role === "ADMIN" && (
                          <button
                            type="button"
                            className="btn-row-action delete"
                            onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                            title="Admin Delete Order (Protected by server RBAC)"
                          >
                            <TrashIcon size={12} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Orders Stream (Shown on mobile devices <= 768px instead of 9-col table) */}
      <div className="mobile-orders-cards">
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-tertiary)" }}>
            <div
              className="spinner-clockwise"
              style={{
                width: "28px",
                height: "28px",
                border: "3px solid var(--border-subtle)",
                borderTopColor: "var(--accent-primary)",
                borderRadius: "50%",
                animation: "spin 0.85s linear infinite",
                margin: "0 auto 12px auto"
              }}
            />
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Loading orders...
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-tertiary)" }}>
            No orders match current filters.
          </div>
        ) : (
          orders.map((order) => {
            const isSelected = selectedOrderIds.includes(order.id);
            const itemsSummary =
              order.items && order.items.length > 0
                ? order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")
                : "No items";

            return (
              <div
                key={order.id}
                className={`mobile-order-card ${isSelected ? "selected-card" : ""}`}
                onClick={() => onViewOrder(order)}
              >
                <div className="m-card-header">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      aria-label={`Select order ${order.orderNumber}`}
                      checked={isSelected}
                      onChange={() => onToggleSelectOrder(order.id)}
                    />
                    <span className="m-card-id">{order.orderNumber}</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => onCopyText(order.orderNumber)}
                      title="Copy Order ID"
                    >
                      <CopyIcon size={12} />
                    </button>
                  </div>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {getStatusIconSvg(order.status)}
                    <span>{order.status}</span>
                  </span>
                </div>

                <div className="m-card-customer">
                  <span className="m-customer-name">{order.customerName}</span>
                  <span className="m-customer-info">{itemsSummary}</span>
                </div>

                <div className="m-card-footer">
                  <span className="m-card-date">{formatDate(order.createdAt)}</span>
                  <span className="m-card-amount">
                    {order.totalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{" "}
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>
                      SAR
                    </span>
                  </span>
                </div>

                {currentUser?.role === "ADMIN" && (
                  <div
                    className="m-card-actions"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "8px",
                      marginTop: "2px",
                      display: "flex",
                      justifyContent: "flex-end"
                    }}
                  >
                    <button
                      type="button"
                      className="btn-row-action delete"
                      onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                      title="Admin Delete Order"
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                    >
                      <TrashIcon size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <footer className="table-footer">
        <div className="footer-left">
          <span>
            Showing <strong>{startItem} to {endItem}</strong> of{" "}
            <strong>{totalFilteredRecords.toLocaleString()}</strong> orders (
            {systemTotal.toLocaleString()} registered)
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Rows:</span>
            <select
              className="rows-per-page-select"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="pagination-controls">
          <button
            type="button"
            className="page-btn"
            disabled={!pagination.hasPrev || loading}
            onClick={() => onPageChange(pagination.page - 1)}
            style={{ padding: "0 14px", gap: "6px" }}
            title="Previous Page"
          >
            <ChevronLeftIcon size={14} />
            <span>Prev</span>
          </button>

          {renderPaginationButtons()}

          <button
            type="button"
            className="page-btn"
            disabled={!pagination.hasNext || loading}
            onClick={() => onPageChange(pagination.page + 1)}
            style={{ padding: "0 14px", gap: "6px" }}
            title="Next Page"
          >
            <span>Next</span>
            <ChevronRightIcon size={14} />
          </button>

          <form onSubmit={handleJumpSubmit} className="page-jump-box">
            <span>Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              placeholder={pagination.page.toString()}
              className="page-jump-input"
              aria-label="Direct jump to page"
            />
            <span>of {totalPages.toLocaleString()}</span>
          </form>
        </div>
      </footer>
    </section>
  );
};
