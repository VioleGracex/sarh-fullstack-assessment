import React from "react";
import type { Order, OrderStatus } from "../types/order";
import {
  CheckIcon,
  ClockIcon,
  SpinLoaderIcon,
  XCircleIcon,
  CloseIcon,
  PrinterIcon
} from "./icons";

interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ order, onClose }) => {
  if (!order) return null;

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
            <CloseIcon size={18} />
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
                color: "var(--accent-text)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              Audit Signature & Transaction Guard
            </span>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "12px", lineHeight: "1.5" }}>
              Idempotency Key: <code style={{ color: "var(--accent-text)" }}>{order.idempotencyKey || "N/A"}</code>
            </p>
          </div>

          {/* Customer Profile Box */}
          <div className="detail-section">
            <h3 className="section-title">Customer Information</h3>
            <div className="detail-card">
              <div className="detail-field">
                <span className="field-label">Full Name</span>
                <span className="field-value">{order.customerName}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Contact Email</span>
                <span className="field-value">{order.customerEmail}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Internal Order ID</span>
                <span className="field-value font-mono" style={{ fontSize: "11px" }}>
                  {order.id}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items List */}
          <div className="detail-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h3 className="section-title" style={{ margin: 0 }}>Line Items</h3>
              <span className="items-count-badge">
                {order.items?.length || 0} {(order.items?.length || 0) === 1 ? "Product" : "Products"}
              </span>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="line-items-table">
                {order.items.map((item, index) => (
                  <div key={item.id || index} className="line-item-row">
                    <div className="item-main">
                      <div className="item-name">{item.productName}</div>
                      <div className="item-meta">
                        {item.quantity} × {item.unitPrice.toFixed(2)} SAR
                      </div>
                    </div>
                    <div className="item-subtotal">
                      {(item.quantity * item.unitPrice).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{" "}
                      SAR
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-items-notice">No individual line items recorded.</div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="order-totals-summary">
            <div className="summary-line">
              <span>Taxable Subtotal</span>
              <span>
                {preTax.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
            <div className="summary-line">
              <span>Value Added Tax (15% KSA Standard)</span>
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
            <PrinterIcon size={14} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
