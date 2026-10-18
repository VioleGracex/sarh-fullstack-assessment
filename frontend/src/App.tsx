import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { StatCards } from "./components/StatCards";
import { ControlsBar } from "./components/ControlsBar";
import { OrdersTable } from "./components/OrdersTable";
import { OrderDrawer } from "./components/OrderDrawer";
import { OrderDetailDrawer } from "./components/OrderDetailDrawer";
import { useOrders } from "./hooks/useOrders";
import type { User, Theme, Density, Order } from "./types/order";

interface ToastItem {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
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
  const [currentUser, setCurrentUser] = useState<User>({
    id: "admin-seed-id",
    email: "admin@sarh.ai",
    role: "ADMIN"
  });
  const [authToken, setAuthToken] = useState<string>("");

  // Slide-over Drawers state
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // In-page Toast Notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

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
      try {
        const password =
          currentUser.role === "ADMIN"
            ? (import.meta.env.VITE_ADMIN_PASSWORD || "")
            : (import.meta.env.VITE_AGENT_PASSWORD || "");
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
    login();
  }, [currentUser.email, currentUser.role]);

  const handleSwitchUser = (newRole: "ADMIN" | "AGENT") => {
    if (newRole === "ADMIN") {
      setCurrentUser({ id: "admin-id", email: "admin@sarh.ai", role: "ADMIN" });
      showToast("Switched to Admin role (Delete operations allowed)", "info");
    } else {
      setCurrentUser({ id: "agent-id", email: "agent@sarh.ai", role: "AGENT" });
      showToast("Switched to Agent role (Delete operations blocked by server RBAC)", "warning");
    }
  };

  // Section 3: Delete order protected by server-side RBAC
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderNumber}? This action is protected by server-side RBAC.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || "Failed to delete order");
      }

      showToast(`Order ${orderNumber} deleted successfully by ${currentUser.role}.`, "success");
      refresh();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCopyText = (text: string, label = "order number") => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`, "info");
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
          onSortToggle={toggleSort}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onViewOrder={(order) => setSelectedOrder(order)}
          onDeleteOrder={handleDeleteOrder}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
