import React from "react";
import type { User, Theme } from "../types/order";
import {
  SunIcon,
  MoonIcon,
  BrandLogoIcon,
  UserIcon,
  CaretDownIcon,
  LogoutIcon,
  StatsAnalyticsIcon,
  QrCodeIcon
} from "./icons/index.tsx";

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  currentUser: User | null;
  onSwitchUser: (role: "ADMIN" | "AGENT") => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  totalOrders?: number;
  onOpenStatsModal?: () => void;
  onOpenConnectMobile?: () => void;
  isBackendOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  currentUser,
  onSwitchUser,
  onOpenLoginModal,
  onLogout,
  onOpenStatsModal,
  onOpenConnectMobile,
  isBackendOnline = true
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
      {/* Top Appearance Toolbar (Desktop Only) */}
      <header className="theme-toolbar">
        <div className="toolbar-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="mode-toggle-btn"
            id="modeToggleBtn"
            onClick={onToggleTheme}
            aria-label="Toggle theme appearance"
          >
            <span className="mode-icon-box" id="modeIconBox">
              {isDark ? <MoonIcon size={15} /> : <SunIcon size={15} />}
            </span>
            <span id="modeTextLabel">
              {isDark ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
        </div>

        <div className="toolbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onOpenConnectMobile && (
            <button
              type="button"
              className="btn-toolbar"
              onClick={onOpenConnectMobile}
              title="Scan QR Code to access live console on your smartphone over local Wi-Fi"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                fontSize: "11px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent-text)",
                borderColor: "var(--border-subtle)",
                fontWeight: 600
              }}
            >
              <QrCodeIcon size={13} />
              <span>Connect Mobile (Wi-Fi QR)</span>
            </button>
          )}

          {onOpenStatsModal && (
            <button
              type="button"
              className="btn-toolbar"
              onClick={onOpenStatsModal}
              title="System Analytics & Reports"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                fontSize: "11px",
                borderRadius: "var(--radius-sm)"
              }}
            >
              <StatsAnalyticsIcon size={13} />
              <span>System Analytics</span>
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
            <BrandLogoIcon size={22} />
          </div>

          <div className="brand-text">
            <h1>
              <span>SARH</span>
              <span className="brand-full-name"> Business Solutions</span>
              <span className="role-micro-chip">{currentUser?.role || "AGENT"}</span>
              <span className="arabic-title">صرح لحلول الأعمال</span>
            </h1>
            <div className="brand-subtitle">Orders Operations Console · Production System</div>
          </div>

          <div
            className={`status-indicator-pill ${!isBackendOnline ? "offline" : ""}`}
            title={isBackendOnline ? "Backend operational (http://localhost:4000)" : "Backend service offline or unreachable"}
          >
            <span className={`dot-pulse ${!isBackendOnline ? "offline" : ""}`}></span>
            <span className="status-indicator-text">{isBackendOnline ? "Operations Live" : "Operations Down"}</span>
          </div>
        </div>

        <div className="header-right">
          {/* Mobile Theme Toggle Button */}
          <button
            type="button"
            className="mobile-theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme appearance"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </button>

          {currentUser ? (
            <>
              {/* Role Switcher (Desktop) */}
              <div
                className="desktop-role-switcher"
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
                    <UserIcon size={16} />
                  </div>
                  <div className="user-meta">
                    <div className="name">{currentUser.email}</div>
                    <div className="dept">{currentUser.role === "ADMIN" ? "Operations Manager" : "Order Intake Agent"}</div>
                  </div>
                  <CaretDownIcon
                    size={12}
                    style={{
                      marginLeft: "4px",
                      color: "var(--text-tertiary)",
                      transform: isMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform var(--transition-fast)"
                    }}
                  />
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
                      <UserIcon size={14} />
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
                        <StatsAnalyticsIcon size={14} />
                        <span>System Analytics</span>
                      </button>
                    )}

                    {onOpenConnectMobile && (
                      <button
                        type="button"
                        className="dropdown-item-btn"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenConnectMobile();
                        }}
                      >
                        <QrCodeIcon size={14} />
                        <span>Connect Mobile (Wi-Fi QR)</span>
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
                      <LogoutIcon size={14} />
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
              Sign In
            </button>
          )}
        </div>
      </header>
    </>
  );
};
