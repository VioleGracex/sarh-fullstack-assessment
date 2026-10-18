import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { StatCards } from "./components/StatCards";
import { ControlsBar } from "./components/ControlsBar";
import { OrdersTable } from "./components/OrdersTable";
import { OrderDrawer } from "./components/OrderDrawer";
import { OrderDetailDrawer } from "./components/OrderDetailDrawer";
import { LoginModal } from "./components/LoginModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { useOrders } from "./hooks/useOrders";
import type { User, Theme, Density, Order, OrderStatus } from "./types/order";

interface ToastItem {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  action?: {
    label: string;
    icon?: "undo";
    onClick: () => void;
  };
}

export function App() {
  // 1. THEME & DENSITY PERSISTENCE
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("sarh_theme");
    return saved === "midnight-obsidian" ? "midnight-obsidian" : "corporate-steel";
  });

  const [density, setDensity] = useState<Density>(() => {
    const saved = localStorage.getItem("sarh_density");
    return saved === "compact" ? "compact" : "comfortable";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sarh_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
    localStorage.setItem("sarh_density", density);
  }, [density]);

  const handleToggleTheme = () => {
    const nextTheme: Theme = theme === "corporate-steel" ? "midnight-obsidian" : "corporate-steel";
    setTheme(nextTheme);
    showToast(
      nextTheme === "midnight-obsidian"
        ? "Switched to Dark Mode"
        : "Switched to Light Mode",
      "info"
    );
  };

  const handleToggleDensity = () => {
    const nextDensity: Density = density === "comfortable" ? "compact" : "comfortable";
    setDensity(nextDensity);
    showToast(`Layout density set to ${nextDensity}`, "info");
  };

  // 2. USER & RBAC STATE (Admin / Agent)
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: "admin-seed-id",
    email: "admin@sarh.ai",
    role: "ADMIN"
  });
  const [authToken, setAuthToken] = useState<string>("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderNumber: string } | null>(null);
  const [bulkToDeleteIds, setBulkToDeleteIds] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Table Selection & Multi-select State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Slide-over Drawers state
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // In-page Toast Notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: "info" | "success" | "warning" | "error" = "info",
      action?: { label: string; icon?: "undo"; onClick: () => void }
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, action }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, action ? 7500 : 3800);
    },
    []
  );

  // 3. CORE ORDERS HOOK (Silent AbortController Race Condition Defense + System Stats)
  const {
    orders,
    pagination,
    systemStats,
    loading,
    error,
    status,
    search,
    sortBy,
    sortOrder,
    setStatus,
    setSearch,
    setPage,
    setPageSize,
    toggleSort,
    applySort,
    refresh
  } = useOrders({ initialPageSize: 25 });

  // Sync authentication token with role
  useEffect(() => {
    async function login() {
      if (!currentUser) return;
      try {
        const password =
          currentUser.role === "ADMIN"
            ? (import.meta.env.VITE_ADMIN_PASSWORD || "admin123")
            : (import.meta.env.VITE_AGENT_PASSWORD || "agent123");
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentUser.email, password })
        });
        if (res.ok) {
          const json = await res.json();
          setAuthToken(json.token);
          setCurrentUser(json.user);
        }
      } catch (err) {
        console.warn("Could not authenticate initial user:", err);
      }
    }
    if (!authToken && currentUser) {
      login();
    }
  }, [currentUser?.email, currentUser?.role]);

  const handleSwitchUser = async (newRole: "ADMIN" | "AGENT") => {
    const targetEmail = newRole === "ADMIN" ? "admin@sarh.ai" : "agent@sarh.ai";
    const targetPassword = newRole === "ADMIN" ? "admin123" : "agent123";
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword })
      });
      if (res.ok) {
        const json = await res.json();
        setAuthToken(json.token);
        setCurrentUser(json.user);
        showToast(
          newRole === "ADMIN"
            ? "Switched to Admin role (Delete operations allowed)"
            : "Switched to Agent role (Delete operations blocked by server RBAC)",
          "info"
        );
        return;
      }
    } catch (err) {
      console.warn("Could not switch role:", err);
    }
    setCurrentUser({ id: `${newRole.toLowerCase()}-id`, email: targetEmail, role: newRole });
  };

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    showToast(`Signed in as ${user.email} (${user.role})`, "success");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken("");
    showToast("Signed out from operations console", "info");
  };

  // Section 3: Delete order protected by server-side RBAC (In-App Modal Confirmation)
  const handleRequestDelete = (orderId: string, orderNumber: string) => {
    if (!currentUser) {
      showToast("Authentication required: Please sign in as Admin", "error");
      setIsLoginModalOpen(true);
      return;
    }
    if (currentUser.role !== "ADMIN") {
      showToast("Access Denied: Agent role cannot delete orders (Server-side RBAC enforced)", "error");
      return;
    }
    setOrderToDelete({ id: orderId, orderNumber });
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || "Failed to delete order");
      }

      const deletedOrder = json.deletedOrder;
      const deletedNumber = orderToDelete.orderNumber;
      setOrderToDelete(null);
      refresh();

      showToast(
        `Order ${deletedNumber} deleted successfully by ${currentUser?.role || "ADMIN"}.`,
        "success",
        deletedOrder
          ? {
              label: "Undo",
              icon: "undo",
              onClick: async () => {
                try {
                  const restoreRes = await fetch("/api/orders/restore", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ order: deletedOrder })
                  });
                  if (restoreRes.ok) {
                    showToast(`Order ${deletedOrder.orderNumber} restored successfully!`, "info");
                    refresh();
                  } else {
                    const err = await restoreRes.json();
                    showToast(err.message || "Failed to restore order", "error");
                  }
                } catch (err: any) {
                  showToast(err.message || "Failed to restore order", "error");
                }
              }
            }
          : undefined
      );
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // --------------------------------------------------------------------------
  // MULTI-SELECT & BULK ACTIONS HANDLERS
  // --------------------------------------------------------------------------
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAllPage = () => {
    const pageIds = orders.map((o) => o.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedOrderIds.includes(id));

    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  const handleBulkUpdateStatus = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    try {
      const res = await fetch("/api/orders/bulk-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ ids: selectedOrderIds, status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      showToast(`Updated ${data.count} order(s) to ${newStatus}.`, "success");
      setSelectedOrderIds([]);
      refresh();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCopySelectedIds = () => {
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    const ids = selectedOrders.map((o) => o.orderNumber).join(", ");
    navigator.clipboard.writeText(ids);
    showToast(`Copied ${selectedOrders.length} Order ID(s) to clipboard`, "info");
  };

  const handleExportSelectedCsv = () => {
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (selectedOrders.length === 0) return;

    const headers = ["Order ID", "Customer Name", "Customer Email", "Status", "Total Amount (SAR)", "Created Date"];
    const rows = selectedOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerEmail.replace(/"/g, '""')}"`,
      `"${o.status}"`,
      `"${o.totalAmount.toFixed(2)}"`,
      `"${new Date(o.createdAt).toISOString()}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SARH_Orders_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selectedOrders.length} orders as CSV`, "success");
  };

  const handleRequestBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    if (!currentUser) {
      showToast("Authentication required: Please sign in as Admin", "error");
      setIsLoginModalOpen(true);
      return;
    }
    if (currentUser.role !== "ADMIN") {
      showToast("Access Denied: Agent role cannot delete orders (Server-side RBAC enforced)", "error");
      return;
    }
    setBulkToDeleteIds([...selectedOrderIds]);
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkToDeleteIds || bulkToDeleteIds.length === 0) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/orders/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ ids: bulkToDeleteIds })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete orders");

      const count = json.count;
      const deletedOrders = json.deletedOrders;
      setSelectedOrderIds([]);
      setBulkToDeleteIds(null);
      refresh();

      showToast(
        `Successfully deleted ${count} order(s) by ${currentUser?.role || "ADMIN"}.`,
        "success",
        deletedOrders && deletedOrders.length > 0
          ? {
              label: "Undo",
              icon: "undo",
              onClick: async () => {
                try {
                  const restoreRes = await fetch("/api/orders/bulk-restore", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ orders: deletedOrders })
                  });
                  if (restoreRes.ok) {
                    showToast(`Restored ${deletedOrders.length} order(s) successfully!`, "info");
                    refresh();
                  } else {
                    const err = await restoreRes.json();
                    showToast(err.message || "Failed to restore orders", "error");
                  }
                } catch (err: any) {
                  showToast(err.message || "Failed to restore orders", "error");
                }
              }
            }
          : undefined
      );
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyText = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label || "order number"} to clipboard`, "info");
  };

  const handleResetFilters = () => {
    setStatus("ALL");
    setSearch("");
    applySort("createdAt", "desc");
    showToast("Filters reset to default view", "info");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Appearance Toolbar & Main Branding Header */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        totalOrders={systemStats.totalSystemRecords}
      />

      {/* Main Workspace Layout */}
      <main className="app-main">
        {/* Global Error Banner if any */}
        {error && (
          <div
            style={{
              padding: "12px 18px",
              backgroundColor: "var(--badge-cancelled-bg)",
              border: "1px solid var(--badge-cancelled-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--badge-cancelled-text)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={refresh}
              style={{ padding: "4px 10px", fontSize: "11px" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. 4 KPI Summary Cards (Never fluctuate on filter) */}
        <StatCards systemStats={systemStats} />

        {/* 2. Controls Bar (Status Tabs, Search, Sort, Density, Register Button) */}
        <ControlsBar
          status={status}
          onSelectStatus={setStatus}
          systemStats={systemStats}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={applySort}
          density={density}
          onToggleDensity={handleToggleDensity}
          onResetFilters={handleResetFilters}
          onOpenCreateDrawer={() => setIsOrderDrawerOpen(true)}
        />

        {/* 3. Orders Table with Copy, Customer details, Badges, and Registered total in footer */}
        <OrdersTable
          orders={orders}
          pagination={pagination}
          systemTotal={systemStats.totalSystemRecords}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          currentUser={currentUser}
          selectedOrderIds={selectedOrderIds}
          onToggleSelectOrder={handleToggleSelectOrder}
          onToggleSelectAllPage={handleToggleSelectAllPage}
          onBulkUpdateStatus={handleBulkUpdateStatus}
          onBulkDelete={handleRequestBulkDelete}
          onClearSelection={handleClearSelection}
          onExportSelectedCsv={handleExportSelectedCsv}
          onCopySelectedIds={handleCopySelectedIds}
          onSortToggle={toggleSort}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onViewOrder={(order) => setSelectedOrder(order)}
          onDeleteOrder={handleRequestDelete}
          onCopyText={handleCopyText}
        />
      </main>

      {/* Slide-over Drawers */}
      <OrderDrawer
        isOpen={isOrderDrawerOpen}
        onClose={() => setIsOrderDrawerOpen(false)}
        onOrderCreated={(orderNum) => {
          showToast(`Order ${orderNum} created with verified Idempotency Key!`, "success");
          refresh();
        }}
      />

      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
      />

      <ConfirmModal
        isOpen={!!orderToDelete}
        title="Delete Order Confirmation"
        orderNumber={orderToDelete?.orderNumber}
        message="Are you sure you want to delete this order? This action is irreversible and will permanently remove all associated line items from active records."
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setOrderToDelete(null);
        }}
      />

      <ConfirmModal
        isOpen={!!bulkToDeleteIds && bulkToDeleteIds.length > 0}
        title="Bulk Delete Orders Confirmation"
        orderNumber={`${bulkToDeleteIds?.length || 0} Orders Selected`}
        message={`Are you sure you want to delete all ${bulkToDeleteIds?.length || 0} selected orders? This action will permanently remove them from active records and is protected by server-side RBAC.`}
        confirmLabel={`Delete ${bulkToDeleteIds?.length || 0} Orders`}
        cancelLabel="Cancel"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => {
          if (!isDeleting) setBulkToDeleteIds(null);
        }}
      />

      {/* Toast Notification Container */}
      <div className="toast-container" id="toastContainer">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type} show`}>
            {toast.type === "success" && (
              <svg className="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {toast.type === "info" && (
              <svg className="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}
            {toast.type === "warning" && (
              <svg className="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            )}
            {toast.type === "error" && (
              <svg className="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.action?.onClick();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
              >
                {toast.action.icon === "undo" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6"></path>
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
                  </svg>
                )}
                <span>{toast.action.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
