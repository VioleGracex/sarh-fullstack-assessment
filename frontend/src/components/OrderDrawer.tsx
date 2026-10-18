import React, { useState, useEffect } from "react";
import type { OrderStatus } from "../types/order";

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderNumber: string) => void;
}

interface FormItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

const DEFAULT_ITEMS: FormItem[] = [
  { productName: "Enterprise Fiber Gateway XG", quantity: 2, unitPrice: 1850.0 },
  { productName: "10G SFP+ Optical Transceiver", quantity: 4, unitPrice: 275.0 }
];

function generateUUID(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const [customerName, setCustomerName] = useState("Abdullah Al-Shehri");
  const [customerEmail, setCustomerEmail] = useState("a.shehri@sarh.sa");
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [items, setItems] = useState<FormItem[]>(DEFAULT_ITEMS);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUUID());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const regenerateKey = () => {
    setIdempotencyKey(generateUUID());
  };

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateUUID());
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (items.length >= 5) return;
    setItems((prev) => [
      ...prev,
      { productName: "Cat6A Shielded Patch Cable 2m", quantity: 1, unitPrice: 85.0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Financial calculations (Saudi 15% VAT standard)
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = subtotal * 0.15;
  const grandTotal = subtotal + vat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError("Customer full name must be at least 2 characters.");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setError("A valid customer email is required.");
      return;
    }
    if (items.some((i) => !i.productName.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      setError("All line items must have valid names, quantities >= 1, and positive prices.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          status,
          items,
          totalAmount: grandTotal
        })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.message || errorJson.error || "Failed to create order");
      }

      const createdOrder = await response.json();
      onOrderCreated(createdOrder.orderNumber || "New Order");
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while locking transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`drawer-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className="drawer-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-header">
          <div className="drawer-title">
            <h2>Register Manual Order</h2>
            <p>Phone and direct orders console with strict Idempotency guarantee</p>
          </div>
          <button
            type="button"
            className="btn-close-drawer"
            onClick={onClose}
            aria-label="Close drawer"
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

        <form onSubmit={handleSubmit} className="drawer-body">
          {/* Architecture Note */}
          <div className="drawer-ux-note">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>
              <strong>UX Architecture Note:</strong> The slide-over drawer was chosen for speed in this scenario (rapid 1–5 item intake while keeping the orders table in view). For larger enterprise scopes with 20+ items, customs documents, or multi-step billing, a dedicated <code>/orders/new</code> full page would be preferred.
            </span>
          </div>

          {/* Idempotency Callout */}
          <div className="idempotency-callout">
            <div className="idempotency-callout-header">
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Idempotency-Key Lock (R2 Guarantee)</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "2px 6px", fontSize: "10px" }}
                onClick={regenerateKey}
              >
                Regenerate
              </button>
            </div>
            <div className="idempotency-key-display">
              <span>{idempotencyKey}</span>
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>UUIDv4</span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              Prevents double-click or network resend duplicate orders on server & DB level.
            </span>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontSize: "12px"
              }}
            >
              {error}
            </div>
          )}

          {/* Customer Fields */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="custName">
                Customer Full Name
              </label>
              <input
                type="text"
                className="form-input"
                id="custName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Faisal Al-Zahrani"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="custEmail">
                Customer Email
              </label>
              <input
                type="email"
                className="form-input"
                id="custEmail"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="name@domain.sa"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="orderStatusSelect">
              Initial Order Status
            </label>
            <select
              className="form-select"
              id="orderStatusSelect"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              <option value="PENDING">PENDING - Needs Verification</option>
              <option value="PROCESSING">PROCESSING - Direct to Warehouse</option>
              <option value="COMPLETED">COMPLETED - Fulfilled Immediately</option>
            </select>
          </div>

          {/* Line Items Builder */}
          <div className="line-items-section">
            <div className="line-items-header">
              <span className="form-label">Order Line Items (1–5 items)</span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "4px 10px", fontSize: "11px" }}
                onClick={handleAddItem}
                disabled={items.length >= 5}
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
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add Item ({items.length}/5)</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {items.map((item, idx) => (
                <div key={idx} className="item-row">
                  <input
                    type="text"
                    className="form-input item-name"
                    value={item.productName}
                    onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                    placeholder="Product name"
                    required
                  />
                  <input
                    type="number"
                    className="form-input item-qty"
                    value={item.quantity}
                    min="1"
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                    }
                    placeholder="Qty"
                    required
                  />
                  <input
                    type="number"
                    className="form-input item-price"
                    value={item.unitPrice}
                    step="10"
                    min="1"
                    onChange={(e) =>
                      handleItemChange(idx, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    placeholder="SAR Price"
                    required
                  />
                  <button
                    type="button"
                    className="btn-delete-row"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    title="Remove item"
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
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="order-totals-summary">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>
                {subtotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
            <div className="summary-line">
              <span>VAT (15% Saudi Standard)</span>
              <span>
                {vat.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
            <div className="summary-line grand-total">
              <span>Total Payable</span>
              <span style={{ color: "var(--accent-text)" }}>
                {grandTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                SAR
              </span>
            </div>
          </div>

          <div className="drawer-footer" style={{ margin: "0 -24px -24px -24px" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
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
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{submitting ? "Locking Transaction..." : "Create Order"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
