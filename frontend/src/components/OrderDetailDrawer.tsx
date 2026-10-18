import React from "react";
import type { Order, OrderStatus } from "../types/order";

interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ order, onClose }) => {
  if (!order) return null;

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

  // Tax calculations
  const tax = order.totalAmount * (0.15 / 1.15);
  const preTax = order.totalAmount - tax;

  return (
    <div className="drawer-overlay open" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <h2>{order.orderNumber}</h2>
            <p>Recorded on {formatDate(order.createdAt)} AST</p>
          </div>
          <button
            type="button"
            className="btn-close-drawer"
            onClick={onClose}
            aria-label="Close details drawer"
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

        <div className="drawer-body">
          {/* Status Row */}
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Current Status</span>
            <span className={`status-badge ${order.status.toLowerCase()}`}>
              {getStatusIconSvg(order.status)}
              <span>{order.status}</span>
            </span>
          </div>

          {/* Idempotency Signature & Audit Lock */}
          <div className="idempotency-callout">
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase"
              }}
            >
              Idempotency Signature & Audit Lock
            </span>
            <div className="idempotency-key-display">
              <span>{order.idempotencyKey || "N/A (Direct System Transaction)"}</span>
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>UUIDv4</span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              Locked at DB transaction timestamp: {order.createdAt}
            </span>
          </div>

          {/* Customer Profile */}
          <div className="form-group">
            <label className="form-label">Customer Profile</label>
            <div
              style={{
                backgroundColor: "var(--bg-subtle)",
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)"
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                {order.customerName}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {order.customerEmail}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                Riyadh Corporate Account #{order.id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Items Purchased */}
          <div className="line-items-section">
            <span className="form-label">Items Purchased</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "13px",
                        backgroundColor: "var(--bg-subtle)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-subtle)"
                      }}
                    >
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <strong style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                        {lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} SAR
                      </strong>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>No item details available.</div>
              )}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="order-totals-summary">
            <div className="summary-line">
              <span>Line Items Total</span>
              <span>
                {preTax.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
            <div className="summary-line">
              <span>Tax (15% VAT)</span>
              <span>
                {tax.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
            <div className="summary-line grand-total">
              <span>Final Paid Amount</span>
              <span style={{ color: "var(--accent-text)" }}>
                {order.totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Back to Console
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.print()}
            title="Print receipt or export PDF"
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
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect width="12" height="8" x="6" y="14"></rect>
            </svg>
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
