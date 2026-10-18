import React from "react";
import type { User, Theme } from "../types/order";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  currentUser: User | null;
  onSwitchUser: (role: "ADMIN" | "AGENT") => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  totalOrders?: number;
  onOpenStatsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  onSwitchUser,
  onOpenLoginModal,
  onLogout,
  onOpenStatsModal
}) => {
  const isDark = theme === "midnight-obsidian";
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

        <div className="toolbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onOpenStatsModal && (
            <button
              type="button"
              className="btn-toolbar"
              onClick={onOpenStatsModal}
              title="Open Deep Analytics (O1 Slow Stats API)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                fontSize: "11px",
                borderRadius: "var(--radius-sm)"
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Slow Stats API (O1)</span>
            </button>
          )}
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
            <span>Operations Live</span>
          </div>
        </div>

        <div className="header-right">
          {currentUser ? (
            <>
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

              {/* User Profile with Dropdown Menu */}
              <div className="profile-menu-container" ref={menuRef}>
                <div
                  className="user-profile"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  title="Account menu"
                  style={{
                    backgroundColor: isMenuOpen ? "var(--bg-subtle)" : undefined,
                    transition: "all var(--transition-fast)"
                  }}
                >
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
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      marginLeft: "4px",
                      color: "var(--text-tertiary)",
                      transform: isMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform var(--transition-fast)"
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                {/* Profile Dropdown Options */}
                {isMenuOpen && (
                  <div className="profile-dropdown-menu">
                    <div className="dropdown-user-header">
                      <div className="dropdown-user-email">{currentUser.email}</div>
                      <div className="dropdown-user-role-badge">
                        Active Role:{" "}
                        <strong
                          style={{
                            color:
                              currentUser.role === "ADMIN"
                                ? "var(--accent-primary)"
                                : "var(--badge-processing-text)"
                          }}
                        >
                          {currentUser.role}
                        </strong>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button
                      type="button"
                      className="dropdown-item-btn"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenLoginModal();
                      }}
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
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                      <span>Switch User / Re-login</span>
                    </button>

                    {onOpenStatsModal && (
                      <button
                        type="button"
                        className="dropdown-item-btn"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenStatsModal();
                        }}
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
                          <line x1="18" y1="20" x2="18" y2="10"></line>
                          <line x1="12" y1="20" x2="12" y2="4"></line>
                          <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span>Slow Stats API (O1)</span>
                      </button>
                    )}

                    <div className="dropdown-divider"></div>

                    <button
                      type="button"
                      className="dropdown-item-btn danger"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
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
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="btn-primary"
              style={{ padding: "6px 14px", fontSize: "12px" }}
            >
              Sign In (JWT)
            </button>
          )}
        </div>
      </header>
    </>
  );
};
