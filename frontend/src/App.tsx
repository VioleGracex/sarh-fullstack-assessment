import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { RapidFilterTester } from "./components/RapidFilterTester";
import { OrdersTable } from "./components/OrdersTable";
import { CreateOrderModal } from "./components/CreateOrderModal";
import { StatsModal } from "./components/StatsModal";
import { useOrders } from "./hooks/useOrders";
import type { User } from "./types/order";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function App() {
  // Current user & JWT token state (Section 3 Code Review)
  const [currentUser, setCurrentUser] = useState<User>({
    id: "admin-seed-id",
    email: "admin@sarh.ai",
    role: "ADMIN"
  });
  const [authToken, setAuthToken] = useState<string>("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Core Orders Hook (Handles R1 pagination, search, status filter, sort, and AbortController)
  const {
    orders,
    pagination,
    loading,
    error,
    status,
    search,
    sortBy,
    sortOrder,
    abortedCount,
    latestCompletedRequestId,
    setStatus,
    setSearch,
    setPage,
    setPageSize,
    toggleSort,
    refresh
  } = useOrders({ initialPageSize: 25 });

  // Automatically fetch real JWT token on mount or user switch
  useEffect(() => {
    async function login() {
      try {
        const password = currentUser.role === "ADMIN" ? "admin123" : "agent123";
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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSwitchUser = (newRole: "ADMIN" | "AGENT") => {
    if (newRole === "ADMIN") {
      setCurrentUser({ id: "admin-id", email: "admin@sarh.ai", role: "ADMIN" });
      showToast("Switched to Admin role (Full permissions, can delete orders)", "success");
    } else {
      setCurrentUser({ id: "agent-id", email: "agent@sarh.ai", role: "AGENT" });
      showToast("Switched to Agent role (Delete operations restricted by server RBAC)", "success");
    }
  };

  // Section 3: Delete order with server-enforced RBAC
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenStatsModal={() => setIsStatsOpen(true)}
        totalOrders={pagination.totalRecords}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Floating Toast Notification */}
        {notification && (
          <div
            className={`mb-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Global Error Notice */}
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={refresh}
              className="px-3 py-1 bg-rose-600 text-white rounded-md font-bold hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* R1 Rapid Filter Tester & Live Telemetry Monitor */}
        <RapidFilterTester
          currentStatus={status}
          onSelectStatus={setStatus}
          abortedCount={abortedCount}
          latestRequestId={latestCompletedRequestId}
          loading={loading}
        />

        {/* Orders Table */}
        <OrdersTable
          orders={orders}
          pagination={pagination}
          loading={loading}
          search={search}
          sortBy={sortBy}
          sortOrder={sortOrder}
          currentUser={currentUser}
          onSearchChange={setSearch}
          onSortToggle={toggleSort}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onDeleteOrder={handleDeleteOrder}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>SARH Business Solutions • Orders Console Technical Assessment V2</span>
          <span className="font-mono text-[11px] text-slate-400">
            Node.js + Express + Prisma + SQLite (50,000+ Indexed Rows) • React 18+ Vite
          </span>
        </div>
      </footer>

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onOrderCreated={() => {
          showToast("Order created successfully!", "success");
          refresh();
        }}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />
    </div>
  );
}

export default App;
