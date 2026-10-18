import React from "react";
import {
  SuccessIcon,
  InfoIcon,
  WarningIcon,
  ErrorIcon,
  UndoIcon,
  CloseIcon
} from "./icons";

export interface ToastItem {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  action?: {
    label: string;
    icon?: "undo";
    onClick: () => void;
  };
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss
}) => {
  if (toasts.length === 0) return null;

  return (
    <aside className="toast-container" id="toastContainer" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} show`}
          role="status"
        >
          {toast.type === "success" && (
            <SuccessIcon className="toast-icon" />
          )}
          {toast.type === "info" && (
            <InfoIcon className="toast-icon" />
          )}
          {toast.type === "warning" && (
            <WarningIcon className="toast-icon" />
          )}
          {toast.type === "error" && (
            <ErrorIcon className="toast-icon" />
          )}

          <span style={{ flex: 1 }}>{toast.message}</span>

          {toast.action && (
            <button
              type="button"
              className="toast-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
            >
              {toast.action.icon === "undo" && <UndoIcon />}
              <span>{toast.action.label}</span>
            </button>
          )}

          <button
            type="button"
            className="toast-close-btn"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            <CloseIcon size={12} />
          </button>
        </div>
      ))}
    </aside>
  );
};
