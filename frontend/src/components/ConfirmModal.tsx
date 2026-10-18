import React, { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  orderNumber?: string;
  customerName?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  orderNumber,
  customerName,
  message = "This action is irreversible and protected by server-side RBAC.",
  confirmLabel = "Delete Order",
  cancelLabel = "Cancel",
  isDestructive = true,
  loading = false,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="confirm-modal-card">
        {/* Modal Header */}
        <div
          style={{
            padding: "24px 24px 16px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px"
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: isDestructive ? "var(--badge-cancelled-bg)" : "var(--accent-subtle)",
              color: isDestructive ? "var(--badge-cancelled-text)" : "var(--accent-primary)",
              border: `1px solid ${isDestructive ? "var(--badge-cancelled-border)" : "var(--border-subtle)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {isDestructive ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h3
              id="confirm-modal-title"
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                marginBottom: "6px"
              }}
            >
              {title}
            </h3>
            {orderNumber && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "2px 8px",
                  backgroundColor: "var(--bg-subtle)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "var(--text-secondary)"
                }}
              >
                <span>{orderNumber}</span>
                {customerName && <span style={{ color: "var(--text-tertiary)" }}>· {customerName}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "0 24px 20px 24px" }}>
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.5,
              color: "var(--text-secondary)",
              margin: 0,
              marginBottom: "14px"
            }}
          >
            {message}
          </p>

          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              color: "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--accent-primary)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Server-side RBAC verification will enforce Admin role privileges for this request.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: "var(--bg-canvas)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px"
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={isDestructive ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid #ffffff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }}
                />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDestructive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  </svg>
                )}
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
