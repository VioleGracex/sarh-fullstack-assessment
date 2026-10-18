import React from "react";
import type { User, Theme } from "../types/order";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  currentUser: User;
  onSwitchUser: (role: "ADMIN" | "AGENT") => void;
  onOpenStatsModal: () => void;
  totalOrders: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  onSwitchUser,
  onOpenStatsModal,
  totalOrders
}) => {
  const isDark = theme === "midnight-obsidian";

  return (
    <>
      {/* Top Appearance Toolbar */}
      <header className="theme-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <span>Appearance Mode:</span>
          </div>

          <button
            type="button"
            className="mode-toggle-btn"
            id="modeToggleBtn"
            onClick={onToggleTheme}
            aria-label="Toggle theme appearance"
          >
            <span className="mode-icon-box" id="modeIconBox">
              {isDark ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="m4.93 4.93 1.41 1.41"></path>
                  <path d="m17.66 17.66 1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="m6.34 17.66-1.41 1.41"></path>
                  <path d="m19.07 4.93-1.41 1.41"></path>
                </svg>
              )}
            </span>
            <span id="modeTextLabel">
              {isDark ? "Dark Mode (Midnight Obsidian)" : "Light Mode (Corporate Steel)"}
            </span>
          </button>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn-toolbar"
            onClick={onOpenStatsModal}
            title="Inspect background analytics"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span>Slow Stats API (O1)</span>
          </button>
        </div>
      </header>

      {/* Main Application Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-crest">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>

          <div className="brand-text">
            <h1>
              <span>SARH Business Solutions</span>
              <span className="arabic-title">صرح لحلول الأعمال</span>
            </h1>
            <div className="brand-subtitle">Orders Operations Console · Production System</div>
          </div>

          <div className="status-indicator-pill">
            <span className="dot-pulse"></span>
            <span>Operations Live ({totalOrders.toLocaleString()} Orders)</span>
          </div>
        </div>

        <div className="header-right">
          {/* Role Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "2px"
            }}
          >
            <button
              type="button"
              onClick={() => onSwitchUser("ADMIN")}
              style={{
                background: currentUser.role === "ADMIN" ? "var(--bg-surface)" : "none",
                color: currentUser.role === "ADMIN" ? "var(--accent-text)" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: currentUser.role === "ADMIN" ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)"
              }}
            >
              Admin Role
            </button>
            <button
              type="button"
              onClick={() => onSwitchUser("AGENT")}
              style={{
                background: currentUser.role === "AGENT" ? "var(--bg-surface)" : "none",
                color: currentUser.role === "AGENT" ? "var(--accent-text)" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: currentUser.role === "AGENT" ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)"
              }}
            >
              Agent Role
            </button>
          </div>

          <div className="user-profile">
            <div className="avatar-icon-box">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-meta">
              <div className="name">
                {currentUser.role === "ADMIN" ? "Tariq Al-Harbi (Admin)" : "Operations Agent"}
              </div>
              <div className="dept">Operations Team · Shift 1</div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
