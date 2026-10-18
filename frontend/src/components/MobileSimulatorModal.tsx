import React, { useState, useEffect, useRef } from "react";
import type { Theme } from "../types/order";
import {
  SmartphoneIcon,
  CloseIcon,
  ExternalLinkIcon,
  SignalCellularIcon,
  WifiIcon,
  BatteryIcon
} from "./icons";

interface MobileSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

type DevicePreset = "iphone15" | "iphonese" | "pixel8";

export const MobileSimulatorModal: React.FC<MobileSimulatorModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  const [device, setDevice] = useState<DevicePreset>("iphone15");
  const [scale, setScale] = useState<number>(0.88);
  const [time, setTime] = useState<string>("09:41");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation (Esc key closes simulator)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Synchronize theme and safe-area styling with iframe content
  useEffect(() => {
    if (!isOpen) return;
    const iframe = iframeRef.current;
    if (iframe && iframe.contentDocument) {
      try {
        iframe.contentDocument.documentElement.setAttribute("data-theme", theme);
        let safeTop = "54px";
        let safeBottom = "34px";
        if (device === "iphonese") {
          safeTop = "24px";
          safeBottom = "8px";
        } else if (device === "pixel8") {
          safeTop = "38px";
          safeBottom = "24px";
        }
        iframe.contentDocument.documentElement.style.setProperty("--safe-top", safeTop);
        iframe.contentDocument.documentElement.style.setProperty("--safe-bottom", safeBottom);
      } catch {
        // Ignore cross-origin errors if any
      }
    }
  }, [isOpen, theme, device]);

  if (!isOpen) return null;

  // Device chassis dimensions
  const getChassisStyle = () => {
    switch (device) {
      case "iphonese":
        return { width: "375px", height: "667px", borderRadius: "40px" };
      case "pixel8":
        return { width: "412px", height: "890px", borderRadius: "48px" };
      case "iphone15":
      default:
        return { width: "393px", height: "840px", borderRadius: "54px" };
    }
  };

  const chassisStyle = getChassisStyle();

  return (
    <div
      className="mobile-sim-overlay open"
      id="mobileSimulatorModal"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "mobileSimulatorModal") {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Device Simulator"
    >
      <div className="sim-container">
        {/* Companion Top Toolbar */}
        <div className="sim-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SmartphoneIcon size={16} />
            <span style={{ fontWeight: 700 }}>Mobile Device Simulator</span>
          </div>

          {/* Device Presets */}
          <div className="sim-pill-group">
            <button
              type="button"
              className={`sim-pill-btn ${device === "iphone15" ? "active" : ""}`}
              onClick={() => setDevice("iphone15")}
            >
              iPhone 15 Pro (393px)
            </button>
            <button
              type="button"
              className={`sim-pill-btn ${device === "iphonese" ? "active" : ""}`}
              onClick={() => setDevice("iphonese")}
            >
              iPhone SE (375px)
            </button>
            <button
              type="button"
              className={`sim-pill-btn ${device === "pixel8" ? "active" : ""}`}
              onClick={() => setDevice("pixel8")}
            >
              Galaxy S24 (412px)
            </button>
          </div>

          {/* Zoom Scaling */}
          <div className="sim-pill-group">
            <button
              type="button"
              className={`sim-pill-btn ${scale === 1.0 ? "active" : ""}`}
              onClick={() => setScale(1.0)}
            >
              100%
            </button>
            <button
              type="button"
              className={`sim-pill-btn ${scale === 0.88 ? "active" : ""}`}
              onClick={() => setScale(0.88)}
            >
              88%
            </button>
            <button
              type="button"
              className={`sim-pill-btn ${scale === 0.75 ? "active" : ""}`}
              onClick={() => setScale(0.75)}
            >
              75%
            </button>
          </div>

          {/* Pop Out in new tab */}
          <a
            href="/mobile.html"
            target="_blank"
            rel="noopener noreferrer"
            className="sim-pill-btn"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}
            title="Open in dedicated browser tab"
          >
            <ExternalLinkIcon size={12} />
            <span>Pop Out</span>
          </a>

          {/* Close */}
          <button
            type="button"
            className="sim-close-btn"
            onClick={onClose}
            title="Close simulator (Esc)"
          >
            <span>Close</span>
            <CloseIcon size={12} />
          </button>
        </div>

        {/* Realistic Smartphone Chassis Frame */}
        <div
          className="smartphone-chassis"
          style={{
            ...chassisStyle,
            transform: `scale(${scale})`
          }}
        >
          {/* Dynamic Island or Camera Punch Hole */}
          {device === "iphone15" && (
            <div className="phone-dynamic-island">
              <span className="island-lens"></span>
              <span className="island-sensor"></span>
            </div>
          )}
          {device === "pixel8" && (
            <div
              className="phone-dynamic-island"
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                padding: 0,
                justifyContent: "center"
              }}
            >
              <span className="island-lens" style={{ width: "8px", height: "8px" }}></span>
            </div>
          )}

          {/* Working Status Bar */}
          <div className="phone-mockup-status-bar">
            <span>{time}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <SignalCellularIcon size={14} />
              <WifiIcon size={14} />
              <BatteryIcon size={16} />
            </div>
          </div>

          {/* Embedded Mobile Application */}
          <iframe
            ref={iframeRef}
            className="sim-iframe"
            src="/mobile.html"
            title="SARH Mobile Operations Console"
            onLoad={() => {
              if (iframeRef.current?.contentDocument) {
                try {
                  iframeRef.current.contentDocument.documentElement.setAttribute("data-theme", theme);
                } catch {}
              }
            }}
          />

          {/* iOS / Android Home Swipe Indicator */}
          {device !== "iphonese" && <div className="phone-mockup-home-bar"></div>}
        </div>
      </div>
    </div>
  );
};
