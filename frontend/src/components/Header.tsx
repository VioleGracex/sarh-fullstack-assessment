import React from "react";
import { PlusCircle, User as UserIcon, Activity } from "lucide-react";
import type { User } from "../types/order";

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (role: "ADMIN" | "AGENT") => void;
  onOpenCreateModal: () => void;
  onOpenStatsModal: () => void;
  totalOrders: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onOpenCreateModal,
  onOpenStatsModal,
  totalOrders
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Brand & System Status */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <span className="text-xl">S</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">SARH Orders Console</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Live: {totalOrders.toLocaleString()} Orders
                </span>
              </div>
              <p className="text-xs text-slate-500">E-Commerce Operations & Concurrency Protection Engine</p>
            </div>
          </div>

          {/* User Role Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Switcher (For testing Section 3 Admin Delete) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 px-2 font-medium flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" />
                Role:
              </span>
              <button
                type="button"
                onClick={() => onSwitchUser("ADMIN")}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  currentUser.role === "ADMIN"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => onSwitchUser("AGENT")}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  currentUser.role === "AGENT"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Agent
              </button>
            </div>

            {/* Slow Stats API Button (Optional O1) */}
            <button
              type="button"
              onClick={onOpenStatsModal}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>Slow Stats (O1)</span>
            </button>

            {/* Create Order Button (R2) */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 active:scale-95 transition shadow-sm gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
