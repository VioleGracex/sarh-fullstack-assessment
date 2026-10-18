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
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-surface)"
        }}
      >
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
              justifyContent: "center"
            }}
          >
            <BrandLogoIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>SARH Business Solutions</span>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>صرح لحلول الأعمال</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
              Orders Operations Console · Production System
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Operations Live / Down Pill */}
          <div
            className={`status-indicator-pill ${!isBackendOnline ? "offline" : ""}`}
            style={{ cursor: onCheckHealth ? "pointer" : "default" }}
            onClick={onCheckHealth}
            title={isBackendOnline ? "Backend operational (http://localhost:4000)" : "Backend service offline or unreachable"}
          >
            <span className={`dot-pulse ${!isBackendOnline ? "offline" : ""}`}></span>
            <span>{isBackendOnline ? "Operations Live" : "Operations Down"}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="mode-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme appearance"
            style={{ padding: "4px 10px" }}
          >
            <span className="mode-icon-box">
              {isDark ? <MoonIcon size={14} /> : <SunIcon size={14} />}
            </span>
            <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
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
          padding: "32px 16px"
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            padding: "36px 32px",
            boxShadow: "var(--shadow-lg)"
          }}
        >
          {/* Brand Icon & Welcome */}
          <div style={{ textAlign: "center", marginBottom: "26px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                margin: "0 auto 14px auto",
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <BrandLogoIcon size={28} />
            </div>

            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Sign In to Operations Console
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Enter your credentials to access the operational orders console
            </p>
          </div>

          {/* Offline Warning Banner */}
          {!isBackendOnline && (
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "var(--badge-cancelled-bg)",
                border: "1px solid var(--badge-cancelled-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--badge-cancelled-text)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "20px"
              }}
            >
              <span>Backend API is currently offline. Please ensure the server is running on port 4000.</span>
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
          <div style={{ marginBottom: "22px" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => handleQuickFill("ADMIN")}
                style={{
                  backgroundColor: email === "admin@sarh.ai" ? "var(--accent-subtle)" : "var(--bg-subtle)",
                  border: email === "admin@sarh.ai" ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  color: email === "admin@sarh.ai" ? "var(--accent-text)" : "var(--text-secondary)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all var(--transition-fast)"
                }}
              >
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>Admin Account</span>
                </div>
                <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
                  admin@sarh.ai
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "3px" }}>
                  Full Delete & Export RBAC
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("AGENT")}
                style={{
                  backgroundColor: email === "agent@sarh.ai" ? "var(--accent-subtle)" : "var(--bg-subtle)",
                  border: email === "agent@sarh.ai" ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  color: email === "agent@sarh.ai" ? "var(--accent-text)" : "var(--text-secondary)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all var(--transition-fast)"
                }}
              >
                <div style={{ fontWeight: 700 }}>Agent Account</div>
                <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}>
                  agent@sarh.ai
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "3px" }}>
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
