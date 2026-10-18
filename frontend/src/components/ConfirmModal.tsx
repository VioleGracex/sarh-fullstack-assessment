import React, { useEffect } from "react";
import { TrashIcon, InfoIcon, LockIcon } from "./icons";

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
              <TrashIcon size={22} strokeWidth={2.2} />
            ) : (
              <InfoIcon size={22} strokeWidth={2.2} />
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
            <LockIcon size={15} style={{ flexShrink: 0, color: "var(--accent-primary)" }} />
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
                  <TrashIcon size={14} />
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
