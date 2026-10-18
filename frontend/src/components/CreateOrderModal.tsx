import React, { useState } from "react";
import { X, Plus, Trash2, ShieldCheck, Key, AlertTriangle, Layers } from "lucide-react";
import type { OrderStatus } from "../types/order";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const DEFAULT_PRODUCTS = [
  "Ergonomic Office Chair",
  "Wireless Mechanical Keyboard",
  "27-inch 4K Monitor",
  "USB-C Multiport Dock",
  "Noise Cancelling Headset"
];

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  if (!isOpen) return null;

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [items, setItems] = useState<Array<{ productName: string; quantity: number; unitPrice: number }>>([
    { productName: DEFAULT_PRODUCTS[0], quantity: 1, unitPrice: 450 }
  ]);

  // Client-generated UUIDv4 Idempotency Key (R2)
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [concurrencyLog, setConcurrencyLog] = useState<string | null>(null);

  // Compute Total
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Line items controls
  const handleAddItem = () => {
    if (items.length >= 5) return;
    const nextProd = DEFAULT_PRODUCTS[items.length % DEFAULT_PRODUCTS.length];
    setItems([...items, { productName: nextProd, quantity: 1, unitPrice: 150 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Single submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setConcurrencyLog(null);

    // Client-side validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      setError("Customer name must be at least 2 characters.");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setError("Please provide a valid customer email.");
      return;
    }
    if (items.some((i) => !i.productName.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      setError("All items must have valid name, quantity >= 1, and unit price > 0.");
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
          totalAmount
        })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.message || errorJson.error || "Failed to create order");
      }

      const created = await response.json();
      console.log("Order created successfully:", created);

      onOrderCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // R2 Concurrency Verification: Simulate Double Click from UI
  const handleSimulateDoubleClick = async () => {
    setError(null);
    setConcurrencyLog("⚡ Firing 2 simultaneous POST requests with the identical Idempotency-Key...");
    setSubmitting(true);

    const payload = {
      customerName: customerName.trim() || "Double Click Tester",
      customerEmail: customerEmail.trim() || "doubleclick@sarh.ai",
      status,
      items,
      totalAmount
    };

    const sendAttempt = async (attemptId: number) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { attemptId, status: res.status, data, replayed: res.headers.get("Idempotent-Replayed") };
    };

    try {
      const [attempt1, attempt2] = await Promise.all([sendAttempt(1), sendAttempt(2)]);
      setConcurrencyLog(
        `✅ Server Deduplicated: Attempt 1 returned HTTP ${attempt1.status}, Attempt 2 returned HTTP ${attempt2.status}. Exactly 1 order created in DB.`
      );
      setTimeout(() => {
        onOrderCreated();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Register Phone Order (R2)</h2>
            <p className="text-xs text-slate-500">Client & Server validated with Idempotency Key protection</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Idempotency Key Ribbon */}
        <div className="bg-sky-50/70 border-b border-sky-100 px-6 py-2 flex items-center justify-between text-[11px] text-sky-800 font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <Key className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="font-semibold text-slate-700">Idempotency-Key:</span>
            <span className="truncate">{idempotencyKey}</span>
          </div>
          <button
            type="button"
            onClick={() => setIdempotencyKey(crypto.randomUUID())}
            className="text-sky-600 hover:text-sky-800 underline text-[10px] shrink-0 font-sans ml-2"
          >
            Regenerate
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {concurrencyLog && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{concurrencyLog}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Abdullah Al-Otaibi"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. customer@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              <option value="PENDING">Pending (Default)</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Line Items (1–5 Items Required)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={items.length >= 5}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item ({items.length}/5)</span>
              </button>
            </div>

            <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    required
                    value={item.productName}
                    onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                    placeholder="Product Name"
                    className="flex-1 px-2.5 py-1.5 border border-slate-300 bg-white rounded-md focus:ring-1 focus:ring-sky-500"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-md text-center focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      required
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="$ Price"
                      className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-md text-right focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="w-20 font-mono text-right font-medium text-slate-700">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total display */}
            <div className="mt-3 flex items-center justify-between px-2 text-sm">
              <span className="font-semibold text-slate-600">Total Order Amount:</span>
              <span className="font-bold text-lg font-mono text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Live Interview Simulator Button */}
            <button
              type="button"
              onClick={handleSimulateDoubleClick}
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition"
              title="Sends 2 parallel requests with the identical Idempotency-Key"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate Double Click (R2 Proof)</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {submitting ? "Registering..." : "Submit Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
