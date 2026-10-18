import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCodeIcon, WifiIcon, CloseIcon, CopyIcon, CheckIcon, SpinLoaderIcon } from "./icons";

interface NetworkInterface {
  name: string;
  ip: string;
}

interface NetworkInfoResponse {
  localIp: string;
  port: number;
  wifiUrl: string;
  interfaces: NetworkInterface[];
}

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess?: (msg: string) => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
  onCopySuccess
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);
  const [selectedIp, setSelectedIp] = useState<string>("");
  const [customPort, setCustomPort] = useState<number>(5173);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingIp, setIsEditingIp] = useState<boolean>(false);

  // Background body scroll lock
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isOpen]);

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch active network adapters on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function fetchNetworkInfo() {
      setLoading(true);
      try {
        const res = await fetch("/api/network-info");
        if (res.ok) {
          const data: NetworkInfoResponse = await res.json();
          if (isMounted) {
            setNetworkInfo(data);
            setSelectedIp(data.localIp);
            setCustomPort(data.port || 5173);
          }
        } else {
          // Fallback to window host if API fails
          const hostIp = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
          if (isMounted) {
            setSelectedIp(hostIp);
            setCustomPort(5173);
          }
        }
      } catch {
        const hostIp = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
        if (isMounted) {
          setSelectedIp(hostIp);
          setCustomPort(5173);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchNetworkInfo();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Generate QR Code whenever selected IP or Port changes
  const activeUrl = `http://${selectedIp || "127.0.0.1"}:${customPort}`;

  useEffect(() => {
    if (!isOpen || !selectedIp) return;
    let isMounted = true;

    QRCode.toDataURL(activeUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      },
      errorCorrectionLevel: "M"
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeUrl, selectedIp, customPort]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    if (onCopySuccess) {
      onCopySuccess(`Copied Wi-Fi URL (${activeUrl}) to clipboard!`);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card"
        style={{ maxWidth: "440px", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <QrCodeIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                Connect Mobile via Wi-Fi
              </h3>
              <p style={{ margin: 0, fontSize: "11.5px", color: "var(--text-tertiary)" }}>
                Scan to test responsive mobile console live on smartphone
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close connect modal"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px 18px" }}>
          {/* QR Code Presentation Box */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)"
            }}
          >
            <div
              style={{
                padding: "10px",
                backgroundColor: "#ffffff",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                lineHeight: 0
              }}
            >
              {loading || !qrDataUrl ? (
                <div
                  style={{
                    width: "180px",
                    height: "180px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#64748b"
                  }}
                >
                  <SpinLoaderIcon size={24} className="spin-animation" />
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>Generating QR Code...</span>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${activeUrl}`}
                  style={{ width: "180px", height: "180px", display: "block" }}
                />
              )}
            </div>

            {/* Active URL Banner */}
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: "360px",
                gap: "8px",
                padding: "6px 10px",
                backgroundColor: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, overflow: "hidden" }}>
                <span className="dot-pulse live" style={{ width: "7px", height: "7px", flexShrink: 0 }}></span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                  title={activeUrl}
                >
                  {activeUrl}
                </span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleCopyLink}
                style={{ padding: "4px 8px", fontSize: "11px", gap: "4px", flexShrink: 0 }}
                title="Copy URL to clipboard"
              >
                {copied ? <CheckIcon size={12} style={{ color: "#10b981" }} /> : <CopyIcon size={12} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Network Adapter Selection / Manual IP Configuration */}
          {networkInfo?.interfaces && networkInfo.interfaces.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                Detected Network Adapters:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {networkInfo.interfaces.map((iface) => (
                  <button
                    key={`${iface.name}-${iface.ip}`}
                    type="button"
                    onClick={() => setSelectedIp(iface.ip)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid",
                      borderColor: selectedIp === iface.ip ? "var(--accent-primary)" : "var(--border-subtle)",
                      backgroundColor: selectedIp === iface.ip ? "var(--accent-subtle)" : "var(--bg-surface)",
                      color: selectedIp === iface.ip ? "var(--accent-text)" : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <WifiIcon size={11} />
                    <span><strong>{iface.name}:</strong> {iface.ip}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual IP/Port Override Toggle */}
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
            {!isEditingIp ? (
              <button
                type="button"
                onClick={() => setIsEditingIp(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: 0,
                  textDecoration: "underline"
                }}
              >
                Change or override IP / Port manually
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="text"
                  value={selectedIp}
                  onChange={(e) => setSelectedIp(e.target.value)}
                  placeholder="e.g. 192.168.1.15"
                  className="search-input"
                  style={{ height: "30px", fontSize: "12px", flex: 2 }}
                />
                <input
                  type="number"
                  value={customPort}
                  onChange={(e) => setCustomPort(Number(e.target.value))}
                  placeholder="5173"
                  className="search-input"
                  style={{ height: "30px", fontSize: "12px", flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditingIp(false)}
                  style={{ height: "30px", padding: "0 8px", fontSize: "11px" }}
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Instructions checklist */}
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              fontSize: "11.5px",
              color: "var(--text-secondary)",
              lineHeight: 1.45
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
              Quick Setup Steps:
            </div>
            <ol style={{ margin: 0, paddingLeft: "16px" }}>
              <li>Connect your phone to the <strong>same Wi-Fi network</strong> as this computer.</li>
              <li>Open your phone's default <strong>Camera app</strong> (or Google Lens) and aim at the QR code.</li>
              <li>Tap the pop-up notification banner to launch the live SARH Console in mobile Safari or Chrome.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 12px", textDecoration: "none" }}
          >
            Open in New Tab
          </a>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ padding: "6px 18px", fontSize: "12px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
