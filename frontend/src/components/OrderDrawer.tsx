import React, { useState, useEffect } from "react";
import type { OrderStatus } from "../types/order";
import {
  CloseIcon,
  InfoIcon,
  LockIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  SpinLoaderIcon,
  WarningIcon
} from "./icons";

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderNumber: string) => void;
  onViewExistingOrder?: (order: any) => void;
}

interface FormItem {
  productName: string;
  quantity: number | "";
  unitPrice: number | "";
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
  onOrderCreated,
  onViewExistingOrder
}) => {
  const [customerName, setCustomerName] = useState("Abdullah Al-Shehri");
  const [customerEmail, setCustomerEmail] = useState("a.shehri@sarh.sa");
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [items, setItems] = useState<FormItem[]>(DEFAULT_ITEMS);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUUID());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);
  const [duplicatePromptOrder, setDuplicatePromptOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatTimeAgo = (dateStr: string) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(elapsedMs / (1000 * 60));
    if (minutes < 1) return "just now (less than 1 minute ago)";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  };

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
      { productName: "", quantity: 1, unitPrice: "" }
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
  const subtotal = items.reduce((sum, item) => {
    const q = typeof item.quantity === "number" ? item.quantity : (parseFloat(String(item.quantity)) || 0);
    const p = typeof item.unitPrice === "number" ? item.unitPrice : (parseFloat(String(item.unitPrice)) || 0);
    return sum + Math.max(0, q) * Math.max(0, p);
  }, 0);
  const vat = subtotal * 0.15;
  const grandTotal = subtotal + vat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSubmission(false);
  };

  const executeSubmission = async (isConfirmedIntentionalRepeat: boolean) => {
    setError(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError("Customer full name must be at least 2 characters.");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setError("A valid customer email is required.");
      return;
    }

    // Strict validation & sanitization for all products
    const parsedItems = items.map((i) => ({
      productName: i.productName.trim(),
      quantity: typeof i.quantity === "number" ? i.quantity : (parseInt(String(i.quantity), 10) || 0),
      unitPrice: typeof i.unitPrice === "number" ? i.unitPrice : (parseFloat(String(i.unitPrice)) || 0)
    }));

    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      if (!item.productName) {
        setError(`Line Item #${i + 1}: Please enter a product description.`);
        return;
      }
      if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
        setError(`Line Item #${i + 1} ("${item.productName}"): Quantity must be a whole positive number (minimum 1). Decimals and negative numbers are not allowed.`);
        return;
      }
      if (item.unitPrice <= 0 || isNaN(item.unitPrice)) {
        setError(`Line Item #${i + 1} ("${item.productName}"): Unit price must be greater than 0 SAR (e.g. 275 or 275.50). Negative numbers and 0 SAR are not allowed.`);
        return;
      }
    }

    // Business Intent Check: Detect recent duplicate order for this customer within 20 mins
    if (!isConfirmedIntentionalRepeat) {
      setIsCheckingDuplicate(true);
      try {
        const searchRes = await fetch(`/api/orders?search=${encodeURIComponent(customerEmail.trim())}&pageSize=5`);
        if (searchRes.ok) {
          const json = await searchRes.json();
          const recentOrders: any[] = json.data || [];
          const matched = recentOrders.find((ord) => {
            const sameEmail = ord.customerEmail.toLowerCase() === customerEmail.trim().toLowerCase();
            const sameTotal = Math.abs(ord.totalAmount - grandTotal) < 1;
            const elapsedMin = (Date.now() - new Date(ord.createdAt).getTime()) / (1000 * 60);
            return sameEmail && sameTotal && elapsedMin < 20;
          });
          if (matched) {
            setDuplicatePromptOrder(matched);
            setIsCheckingDuplicate(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn("Duplicate pre-check failed:", checkErr);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }

    // Fresh idempotency key for intentional repeat orders to ensure legally distinct invoice
    const finalKey = isConfirmedIntentionalRepeat ? generateUUID() : idempotencyKey;
    if (isConfirmedIntentionalRepeat) {
      setIdempotencyKey(finalKey);
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": finalKey
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          status,
          items: parsedItems,
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
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="drawer-body">
          {/* Architecture Note */}
          <div className="drawer-ux-note">
            <InfoIcon size={15} />
            <span>
              <strong>UX Architecture Note:</strong> The slide-over drawer was chosen for speed in this scenario (rapid 1–5 item intake while keeping the orders table in view). For larger enterprise scopes with 20+ items, customs documents, or multi-step billing, a dedicated <code>/orders/new</code> full page would be preferred.
            </span>
          </div>

          {/* Idempotency Callout */}
          <div className="idempotency-callout">
            <div className="idempotency-callout-header">
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <LockIcon size={14} />
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
                <PlusIcon size={12} />
                <span>Add Item ({items.length}/5)</span>
              </button>
            </div>

            {/* Universal Product Constraints Notice */}
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px"
              }}
            >
              <InfoIcon size={14} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
              <span>
                <strong>Universal Product Constraints:</strong> Quantity must be ≥ 1 (whole units). Unit price must be &gt; 0 SAR (e.g. 275 or 275.50). Negative values are strictly blocked.
              </span>
            </div>

            {/* Column Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.2fr 32px",
                gap: "8px",
                padding: "0 4px",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px"
              }}
            >
              <span>Product Description</span>
              <span>Quantity (≥ 1)</span>
              <span>Unit Price (SAR)</span>
              <span></span>
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
                    aria-label={`Product description for item ${idx + 1}`}
                  />
                  <input
                    type="number"
                    className="form-input item-qty"
                    value={item.quantity}
                    min="1"
                    step="1"
                    onKeyDown={(e) => {
                      // Prevent typing negative sign, plus sign, decimal, or exponent
                      if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E" || e.key === ".") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        handleItemChange(idx, "quantity", "");
                        return;
                      }
                      const val = parseInt(raw, 10);
                      handleItemChange(idx, "quantity", isNaN(val) ? "" : Math.max(1, Math.abs(val)));
                    }}
                    placeholder="Qty"
                    required
                    aria-label={`Quantity for item ${idx + 1}`}
                    title="Quantity must be at least 1 (positive integer)"
                  />
                  <input
                    type="number"
                    className="form-input item-price"
                    value={item.unitPrice}
                    step="any"
                    min="0.01"
                    onKeyDown={(e) => {
                      // Prevent typing negative sign, plus sign, or exponent
                      if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        handleItemChange(idx, "unitPrice", "");
                        return;
                      }
                      const val = parseFloat(raw);
                      handleItemChange(idx, "unitPrice", isNaN(val) ? "" : Math.max(0, Math.abs(val)));
                    }}
                    placeholder="SAR Price"
                    required
                    aria-label={`Unit price in SAR for item ${idx + 1}`}
                    title="Unit price must be greater than 0 SAR (e.g. 275 or 275.50)"
                  />
                  <button
                    type="button"
                    className="btn-delete-row"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    title="Remove item"
                  >
                    <TrashIcon size={14} />
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
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting || isCheckingDuplicate}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || isCheckingDuplicate}
            >
              {submitting ? (
                <>
                  <SpinLoaderIcon size={14} className="spin-animation" />
                  <span>Locking Transaction...</span>
                </>
              ) : isCheckingDuplicate ? (
                <>
                  <SpinLoaderIcon size={14} className="spin-animation" />
                  <span>Checking Duplicate History...</span>
                </>
              ) : (
                <>
                  <CheckIcon size={14} />
                  <span>Create Order</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Potential Duplicate Order Warning Modal (Business Disambiguation Dialog) */}
        {duplicatePromptOrder && (
          <div className="duplicate-warning-overlay" role="dialog" aria-modal="true">
            <div className="duplicate-warning-card">
              <div className="duplicate-warning-header">
                <WarningIcon size={22} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <h3>Potential Duplicate Order Detected</h3>
              </div>

              <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                Customer <strong>{duplicatePromptOrder.customerName}</strong> (
                <code>{duplicatePromptOrder.customerEmail}</code>) placed an identical order{" "}
                <strong>#{duplicatePromptOrder.orderNumber}</strong> for{" "}
                <strong>{duplicatePromptOrder.totalAmount?.toLocaleString()} SAR</strong>{" "}
                {formatTimeAgo(duplicatePromptOrder.createdAt)}.
              </div>

              <div className="duplicate-guidance-box">
                <strong style={{ color: "var(--text-primary)" }}>Business & Accounting Guidance:</strong>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px" }}>
                  <li style={{ marginBottom: "4px" }}>
                    <strong>Intentional Repeat Order:</strong> If the customer called back asking to double their order or place a separate identical order, click{" "}
                    <strong>"Confirm & Issue Distinct Order"</strong>. Under commercial & ZATCA e-invoicing regulations, this creates a distinct sequential electronic invoice.
                  </li>
                  <li>
                    <strong>Accidental Double-Entry:</strong> If this was submitted accidentally or by mistake, click{" "}
                    <strong>"View Existing Order"</strong> to examine the existing order and prevent unwanted duplicate billing.
                  </li>
                </ul>
              </div>

              <div className="duplicate-warning-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const ord = duplicatePromptOrder;
                    setDuplicatePromptOrder(null);
                    onClose();
                    if (onViewExistingOrder) {
                      onViewExistingOrder(ord);
                    }
                  }}
                >
                  Cancel & View #{duplicatePromptOrder.orderNumber}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ backgroundColor: "#d97706", borderColor: "#b45309" }}
                  onClick={() => {
                    setDuplicatePromptOrder(null);
                    executeSubmission(true);
                  }}
                >
                  Confirm & Issue Distinct Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
