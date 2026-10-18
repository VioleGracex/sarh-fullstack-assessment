import React, { useState } from "react";
import type { User } from "../types/order";
import { BrandLogoIcon } from "./icons";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  currentUser: User | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser
}) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState(currentUser?.email || "admin@sarh.ai");
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
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay open" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div
        className="login-card-modal"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          padding: "32px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "var(--shadow-lg)",
          zIndex: 102,
          position: "relative"
        }}
      >
        {/* Header & Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
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
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            SARH Operations Authentication
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
            Cryptographically signed JWT with Role-Based Access Control (RBAC)
          </p>
        </div>

        {/* Quick Fill Presets */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
            Quick-Select Seed Account:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleQuickFill("ADMIN")}
              style={{
                backgroundColor: email === "admin@sarh.ai" ? "var(--accent-subtle)" : "var(--bg-subtle)",
                border: email === "admin@sarh.ai" ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                color: email === "admin@sarh.ai" ? "var(--accent-text)" : "var(--text-secondary)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div style={{ fontWeight: 700 }}>Admin Account</div>
              <div style={{ fontSize: "10px", opacity: 0.8 }}>Full Delete & Edit</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("AGENT")}
              style={{
                backgroundColor: email === "agent@sarh.ai" ? "var(--accent-subtle)" : "var(--bg-subtle)",
                border: email === "agent@sarh.ai" ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                color: email === "agent@sarh.ai" ? "var(--accent-text)" : "var(--text-secondary)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div style={{ fontWeight: 700 }}>Agent Account</div>
              <div style={{ fontSize: "10px", opacity: 0.8 }}>Intake & Search Only</div>
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--badge-cancelled-bg)",
              border: "1px solid var(--badge-cancelled-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--badge-cancelled-text)",
              fontSize: "12px",
              marginBottom: "16px"
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="search-input"
              style={{ paddingLeft: "12px" }}
              placeholder="e.g. admin@sarh.ai"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="search-input"
              style={{ paddingLeft: "12px" }}
              placeholder="••••••••"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            {currentUser && (
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: "8px 20px", width: currentUser ? "auto" : "100%", justifyContent: "center" }}
            >
              {loading ? "Authenticating..." : "Sign In & Issue JWT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
