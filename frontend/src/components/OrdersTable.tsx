import React from "react";
import type { Order, PaginationMeta, User, OrderStatus } from "../types/order";

interface OrdersTableProps {
  orders: Order[];
  pagination: PaginationMeta;
  systemTotal: number;
  loading: boolean;
  sortBy: "createdAt" | "totalAmount" | "orderNumber";
  sortOrder: "asc" | "desc";
  currentUser: User;
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
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          opacity: isCurrent ? 1 : 0.35,
          color: isCurrent ? "var(--accent-text)" : "currentColor",
          transform: isCurrent && sortOrder === "asc" ? "rotate(180deg)" : "none",
          transition: "transform 150ms ease"
        }}
      >
        <path d="m7 15 5 5 5-5"></path>
        <path d="m7 9 5-5 5 5"></path>
      </svg>
    );
  };

  const getStatusIconSvg = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case "PENDING":
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case "PROCESSING":
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        );
      case "CANCELLED":
        return (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
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

  // Pagination bounds
  const totalFilteredRecords = pagination.totalRecords;
  const startItem = totalFilteredRecords === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, totalFilteredRecords);
  const totalPages = Math.max(1, pagination.totalPages || Math.ceil(totalFilteredRecords / pagination.pageSize));

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
          <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "var(--text-tertiary)" }}>
            ...
          </span>
        );
      }
      return (
        <button
          key={`page-${p}`}
          type="button"
          className={`page-btn ${p === current ? "active" : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p.toLocaleString()}
        </button>
      );
    });
  };

  return (
    <section className="table-container">
      <div className="table-responsive">
        <table className="orders-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <input type="checkbox" className="custom-checkbox" aria-label="Select all orders" />
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
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "3px solid var(--accent-primary)",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }}
                    />
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                      Querying indexed database records...
                    </div>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-tertiary)" }}>
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ margin: "0 auto 10px auto", opacity: 0.6 }}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="16.65" x2="16.65" y2="11"></line>
                  </svg>
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
                  <tr key={order.id}>
                    <td>
                      <input type="checkbox" className="custom-checkbox" aria-label={`Select order ${order.orderNumber}`} />
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
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                          </svg>
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
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <span>View</span>
                        </button>

                        {currentUser.role === "ADMIN" && (
                          <button
                            type="button"
                            className="btn-row-action delete"
                            onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                            title="Admin Delete Order (Protected by server RBAC)"
                          >
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
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            </svg>
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
            disabled={pagination.page <= 1 || loading}
            onClick={() => onPageChange(1)}
            title="First Page"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>

          <button
            type="button"
            className="page-btn"
            disabled={!pagination.hasPrev || loading}
            onClick={() => onPageChange(pagination.page - 1)}
            title="Previous Page"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {renderPaginationButtons()}

          <button
            type="button"
            className="page-btn"
            disabled={!pagination.hasNext || loading}
            onClick={() => onPageChange(pagination.page + 1)}
            title="Next Page"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <button
            type="button"
            className="page-btn"
            disabled={pagination.page >= totalPages || loading}
            onClick={() => onPageChange(totalPages)}
            title="Last Page"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </button>
        </div>
      </footer>
    </section>
  );
};
