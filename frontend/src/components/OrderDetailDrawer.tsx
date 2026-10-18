import React, { useState, useEffect } from "react";
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
  const [displayOrder, setDisplayOrder] = useState<Order | null>(order);
  const [isOpen, setIsOpen] = useState(false);

  // Sync internal displayOrder with incoming prop and trigger entrance/exit animations
  useEffect(() => {
    if (order) {
      setDisplayOrder(order);
      const frame = requestAnimationFrame(() => {
        setIsOpen(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsOpen(false);
      const timer = setTimeout(() => {
        setDisplayOrder(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [order]);

  // Background body scroll lock while drawer is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isOpen]);

  // Graceful smooth close animation handler (sliding down/out before unmounting)
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  // Keyboard accessibility: ESC key to trigger smooth close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!displayOrder) return null;

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
  const tax = displayOrder.totalAmount * (0.15 / 1.15);
  const preTax = displayOrder.totalAmount - tax;

  return (
    <div
      className={`drawer-overlay ${isOpen ? "open" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <h2>{displayOrder.orderNumber}</h2>
            <p>Recorded on {formatDate(displayOrder.createdAt)} AST</p>
          </div>
          <button
            type="button"
            className="btn-close-drawer"
            onClick={handleClose}
            aria-label="Close details drawer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Status Row */}
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Current Status</span>
            <span className={`status-badge ${displayOrder.status.toLowerCase()}`}>
              {getStatusIconSvg(displayOrder.status)}
              <span>{displayOrder.status}</span>
            </span>
          </div>

          {/* Duplicate Order Protection & Transaction Signature */}
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
              Transaction Verification Key
            </span>
            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "12px", lineHeight: "1.5" }}>
              Key: <code style={{ color: "var(--accent-text)" }}>{displayOrder.idempotencyKey || "N/A"}</code>
            </p>
          </div>

          {/* Customer Profile Box */}
          <div className="detail-section">
            <h3 className="section-title">Customer Information</h3>
            <div className="detail-card">
              <div className="detail-field">
                <span className="field-label">Full Name</span>
                <span className="field-value">{displayOrder.customerName}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Contact Email</span>
                <span className="field-value">{displayOrder.customerEmail}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Internal Order ID</span>
                <span className="field-value" style={{ fontFamily: "monospace", fontSize: "11px" }}>
                  {displayOrder.id}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items List */}
          <div className="detail-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h3 className="section-title" style={{ margin: 0 }}>Line Items</h3>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                {displayOrder.items.length} {displayOrder.items.length === 1 ? "Product" : "Products"}
              </span>
            </div>

            <div className="line-items-stack">
              {displayOrder.items.map((item, idx) => (
                <div key={item.id || idx} className="line-item-row">
                  <div className="line-item-info">
                    <span className="line-item-name">{item.productName}</span>
                    <span className="line-item-sub">
                      {item.quantity} × {item.unitPrice.toFixed(2)} SAR
                    </span>
                  </div>
                  <div className="line-item-total">
                    {(item.quantity * item.unitPrice).toFixed(2)} SAR
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Receipt */}
          <div className="receipt-breakdown">
            <div className="receipt-row">
              <span>Taxable Subtotal</span>
              <span>{preTax.toFixed(2)} SAR</span>
            </div>
            <div className="receipt-row">
              <span>Value Added Tax (15% KSA Standard)</span>
              <span>{tax.toFixed(2)} SAR</span>
            </div>
            <div className="receipt-row-total">
              <span className="receipt-total-label">Final Paid Amount</span>
              <span className="receipt-total-value">
                {displayOrder.totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn-secondary" onClick={handleClose}>
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

export default OrderDetailDrawer;
