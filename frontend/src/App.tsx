import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { StatCards } from "./components/StatCards";
import { ControlsBar } from "./components/ControlsBar";
import { OrdersTable } from "./components/OrdersTable";
import { OrderDrawer } from "./components/OrderDrawer";
import { OrderDetailDrawer } from "./components/OrderDetailDrawer";
import { LoginModal } from "./components/LoginModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { StatsModal } from "./components/StatsModal";
import { ToastContainer, type ToastItem } from "./components/ToastContainer";
import { useOrders } from "./hooks/useOrders";
import type { User, Theme, Density, Order, OrderStatus } from "./types/order";

export function App() {
  // 1. THEME & DENSITY PERSISTENCE (Synced with blocking head script)
  const [theme, setTheme] = useState<Theme>(() => {
    const fromDom = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (fromDom === "midnight-obsidian" || fromDom === "corporate-steel") return fromDom;
    const saved = localStorage.getItem("sarh_theme");
    return saved === "midnight-obsidian" ? "midnight-obsidian" : "corporate-steel";
  });

  const [density, setDensity] = useState<Density>(() => {
    const fromDom = document.documentElement.getAttribute("data-density") as Density | null;
    if (fromDom === "compact" || fromDom === "comfortable") return fromDom;
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
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // In-page Toast Notifications (Strict Clamping to Max 3 + Deduplication)
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
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
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

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
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

      {/* Modular Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
