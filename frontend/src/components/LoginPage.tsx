import React, { useState } from "react";
import type { User, Theme } from "../types/order";
import { BrandLogoIcon, SunIcon, MoonIcon, LockIcon } from "./icons";

interface LoginPageProps {
  theme: Theme;
  onToggleTheme: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  isBackendOnline: boolean;
  onCheckHealth?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  theme,
  onToggleTheme,
  onLoginSuccess,
  isBackendOnline,
  onCheckHealth
}) => {
  const isDark = theme === "midnight-obsidian";
  const [email, setEmail] = useState("admin@sarh.ai");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickFill = (role: "ADMIN" | "AGENT") => {
    if (role === "ADMIN") {
      setEmail("admin@sarh.ai");
      setPassword("admin123");
    } else {
      setEmail("agent@sarh.ai");
      setPassword("agent123");
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || "Authentication failed");
      }

      onLoginSuccess(json.user, json.token);
    } catch (err: any) {
      if (err.message && err.message.includes("Failed to fetch")) {
        setError("Backend API is currently unreachable at http://localhost:4000. Please ensure the backend server is active.");
      } else {
        setError(err.message || "Invalid credentials. Please verify email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-wrapper"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        transition: "background-color var(--transition-normal), color var(--transition-normal)"
      }}
    >
      {/* Top Navbar */}
      <header className="login-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <BrandLogoIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>SARH</span>
              <span className="login-brand-full"> Business Solutions</span>
              <span className="login-brand-ar" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>صرح لحلول الأعمال</span>
            </div>
            <div className="login-brand-sub" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              Orders Operations Console · Production System
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Operations Live / Down Pill */}
          <div
            className={`status-indicator-pill ${!isBackendOnline ? "offline" : ""}`}
            style={{ cursor: onCheckHealth ? "pointer" : "default" }}
            onClick={onCheckHealth}
            title={isBackendOnline ? "Backend operational (http://localhost:4000)" : "Backend service offline or unreachable"}
          >
            <span className={`dot-pulse ${!isBackendOnline ? "offline" : ""}`}></span>
            <span className="login-status-text">{isBackendOnline ? "Operations Live" : "Operations Down"}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="mode-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme appearance"
            style={{ padding: "6px 10px" }}
          >
            <span className="mode-icon-box">
              {isDark ? <MoonIcon size={14} /> : <SunIcon size={14} />}
            </span>
            <span className="login-theme-text">{isDark ? "Dark Mode" : "Light Mode"}</span>
          </button>
        </div>
      </header>

      {/* Main Authentication Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px"
        }}
      >
        <div className="login-card">
          {/* Brand Icon & Welcome */}
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 12px auto",
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <BrandLogoIcon size={26} />
            </div>

            <h1 style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Sign In to Operations Console
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Enter your credentials to access the operational orders console
            </p>
          </div>

          {/* Offline Warning Banner */}
          {!isBackendOnline && (
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "var(--badge-cancelled-bg)",
                border: "1px solid var(--badge-cancelled-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--badge-cancelled-text)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                marginBottom: "16px"
              }}
            >
              <span>Backend API offline on port 4000.</span>
              {onCheckHealth && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onCheckHealth}
                  style={{ padding: "3px 8px", fontSize: "11px", whiteSpace: "nowrap" }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Quick-Select Role Presets */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px"
              }}
            >
              Quick-Select Credentials:
            </div>
            <div className="login-credentials-grid">
              <button
                type="button"
                className={`login-credential-btn ${email === "admin@sarh.ai" ? "active" : ""}`}
                onClick={() => handleQuickFill("ADMIN")}
              >
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>Admin Account</span>
                </div>
                <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "2px" }}>
                  admin@sarh.ai
                </div>
                <div className="login-cred-sub" style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                  Full Delete & Export RBAC
                </div>
              </button>

              <button
                type="button"
                className={`login-credential-btn ${email === "agent@sarh.ai" ? "active" : ""}`}
                onClick={() => handleQuickFill("AGENT")}
              >
                <div style={{ fontWeight: 700 }}>Agent Account</div>
                <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "2px" }}>
                  agent@sarh.ai
                </div>
                <div className="login-cred-sub" style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                  Intake & Search Only
                </div>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "var(--badge-cancelled-bg)",
                border: "1px solid var(--badge-cancelled-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--badge-cancelled-text)",
                fontSize: "12px",
                marginBottom: "18px"
              }}
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "6px"
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="search-input"
                style={{ paddingLeft: "14px", width: "100%" }}
                placeholder="e.g. admin@sarh.ai"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "6px"
                }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="search-input"
                style={{ paddingLeft: "14px", width: "100%" }}
                placeholder="••••••••"
              />
            </div>

            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                fontSize: "11px",
                color: "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <LockIcon size={13} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
              <span>Authentication required: Protected orders console is inaccessible without valid credentials.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: "10px 20px",
                width: "100%",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                marginTop: "6px"
              }}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "16px 24px",
          textAlign: "center",
          fontSize: "11px",
          color: "var(--text-tertiary)",
          borderTop: "1px solid var(--border-subtle)"
        }}
      >
        <span>SARH Business Solutions (صرح لحلول الأعمال) · Production Orders Console</span>
      </footer>
    </div>
  );
};
