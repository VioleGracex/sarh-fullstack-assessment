import React from "react";
import type { User, Theme } from "../types/order";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  currentUser: User;
  onSwitchUser: (role: "ADMIN" | "AGENT") => void;
  totalOrders: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  onSwitchUser,
  totalOrders
}) => {
  const isDark = theme === "midnight-obsidian";

  return (
    <>
      {/* Top Appearance Toolbar */}
      <header className="theme-toolbar">
        <div className="toolbar-left">
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
              {isDark ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
        </div>

        <div className="toolbar-right">
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
            Operations Console v2.0
          </span>
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
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                padding: "0 8px"
              }}
            >
              Active Role:
            </span>
            <button
              type="button"
              onClick={() => onSwitchUser("ADMIN")}
              style={{
                background: currentUser.role === "ADMIN" ? "var(--accent-primary)" : "none",
                color: currentUser.role === "ADMIN" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all var(--transition-fast)"
              }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => onSwitchUser("AGENT")}
              style={{
                background: currentUser.role === "AGENT" ? "var(--accent-primary)" : "none",
                color: currentUser.role === "AGENT" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all var(--transition-fast)"
              }}
            >
              Agent
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
              <div className="name">{currentUser.email}</div>
              <div className="dept">{currentUser.role === "ADMIN" ? "Operations Manager" : "Order Intake Agent"}</div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
