import React from "react";
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, Trash2, 
  ChevronLeft, ChevronRight, Package 
} from "lucide-react";
import type { Order, OrderStatus, PaginationMeta, User } from "../types/order";

interface OrdersTableProps {
  orders: Order[];
  pagination: PaginationMeta;
  loading: boolean;
  search: string;
  sortBy: "createdAt" | "totalAmount" | "orderNumber";
  sortOrder: "asc" | "desc";
  currentUser: User;
  onSearchChange: (search: string) => void;
  onSortToggle: (column: "createdAt" | "totalAmount" | "orderNumber") => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDeleteOrder: (orderId: string, orderNumber: string) => void;
}

const statusBadgeStyles: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
  PROCESSING: { bg: "bg-sky-50 border-sky-200", text: "text-sky-800", dot: "bg-sky-500" },
  COMPLETED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  CANCELLED: { bg: "bg-rose-50 border-rose-200", text: "text-rose-800", dot: "bg-rose-500" }
};

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  pagination,
  loading,
  search,
  sortBy,
  sortOrder,
  currentUser,
  onSearchChange,
  onSortToggle,
  onPageChange,
  onPageSizeChange,
  onDeleteOrder
}) => {
  const renderSortIcon = (column: "createdAt" | "totalAmount" | "orderNumber") => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Search and Table Options Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer name, email, order..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto">
          <span>Rows per page:</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th
                onClick={() => onSortToggle("orderNumber")}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Order #</span>
                  {renderSortIcon("orderNumber")}
                </div>
              </th>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Line Items</th>
              <th
                onClick={() => onSortToggle("totalAmount")}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Total Amount</span>
                  {renderSortIcon("totalAmount")}
                </div>
              </th>
              <th
                onClick={() => onSortToggle("createdAt")}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Created Date</span>
                  {renderSortIcon("createdAt")}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium text-slate-500">Querying 50,000+ orders from indexed database...</p>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400">
                  <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No orders match your filter criteria.</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing the search query or selecting "All Orders".</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const badge = statusBadgeStyles[order.status] || statusBadgeStyles.PENDING;
                const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{order.customerEmail}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badge.bg} ${badge.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`}></span>
                        {order.status}
                      </span>
                    </td>

                    {/* Items preview */}
                    <td className="py-3 px-4">
                      <div className="text-slate-700 font-medium">
                        {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={order.items?.map(i => `${i.quantity}x ${i.productName}`).join(", ")}>
                        {order.items?.map(i => `${i.quantity}x ${i.productName}`).join(", ") || "No items"}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Delete action (Section 3 Auth & Role check) */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {currentUser.role === "ADMIN" ? (
                        <button
                          type="button"
                          onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition"
                          title="Admin Delete (Sec 3)"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic" title="Delete is restricted to Admin role on the server">
                          Admin only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {pagination.totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-900">
            {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)}
          </span>{" "}
          of <span className="font-semibold text-slate-900">{pagination.totalRecords.toLocaleString()}</span> orders
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!pagination.hasPrev || loading}
            onClick={() => onPageChange(pagination.page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 font-medium">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </span>

          <button
            type="button"
            disabled={!pagination.hasNext || loading}
            onClick={() => onPageChange(pagination.page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
