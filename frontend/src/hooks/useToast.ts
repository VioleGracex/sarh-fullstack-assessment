import { useState, useCallback } from "react";
import type { ToastItem } from "../components/ToastContainer";

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: "info" | "success" | "warning" | "error" = "info",
      action?: { label: string; icon?: "undo"; onClick: () => void }
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => {
        // 1. Deduplication: replace any existing toast with the exact same message
        const withoutDuplicate = prev.filter((t) => t.message !== message);
        // 2. Strict Clamping: keep at most 2 previous toasts, so adding 1 gives at most 3 visible
        const clamped = withoutDuplicate.slice(-2);
        return [...clamped, { id, message, type, action }];
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, action ? 7500 : 3200);
    },
    []
  );

  return { toasts, showToast, dismissToast };
}
