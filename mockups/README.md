# SARH Orders Console — UI & Theme Mockups Guide
**صرح لحلول الأعمال | SARH Business Solutions**

This directory contains production-grade interactive HTML mockups for the SARH Orders Console, calibrated for long operations shifts (8+ hours), zero ocular fatigue, maximum readability, and strict enterprise compliance.

---

## 1. Selected Modes & Design System

The application is configured with two primary, eye-comfort modes:

* **Light Mode — Corporate Steel & Sapphire (`data-theme="corporate-steel"`)**:  
  Cool cloud grey canvas (`#f1f5f9`), crisp white card surfaces, slate borders, and deep royal sapphire accents (`#1e40af`). Provides clear visual boundaries and authoritative contrast tailored for Saudi enterprise operations.
* **Dark Mode — Midnight Obsidian & Zinc (`data-theme="midnight-obsidian"`)**:  
  Layered charcoal obsidian (`#12141a`) with soft zinc cards (`#191c24`) and ice-cyan (`#38bdf8`). Strictly avoids `#000000` pure black to eliminate pupil dilation haloing and astigmatic ghosting during night shifts.

Toggle seamlessly between Light and Dark mode using the button on the top toolbar.

---

## 2. Interactive Mobile Simulator (Phone Shape / No F12 Needed)

You do **not** need to press F12 or open browser DevTools to test the mobile experience!

1. **Embedded Phone Simulator in `index.html`**:
   - Click the top toolbar button **"Mobile Phone Mockup"** or tap the floating **"Mobile Device View"** pill at the bottom-right of the desktop console.
   - An interactive, backdrop-blurred **iPhone 15 Pro Titanium chassis** opens with:
     - Metallic titanium rounded bezel (`border-radius: 54px`) and side volume/power buttons.
     - Live **Dynamic Island** with animated camera and sensor cutouts.
     - Working **iOS Status Bar** with real-time clock (`HH:MM`), 5G cellular signal bars, Wi-Fi, and battery indicator.
     - Bottom **iOS Home Indicator** swipe pill.
     - Device Selector: `iPhone 15 Pro (393px)`, `iPhone SE (375px)`, and `Galaxy S24 (412px)`.
     - Zoom Scale: `100%`, `88%`, and `75%` to fit any laptop monitor.
     - Seamless Light/Dark theme synchronization.
     - Press `Esc` or click the backdrop to return to the desktop console.
2. **Standalone Smartphone Frame in [`mobile.html`](file:///d:/task/Sarh_group/mockups/mobile.html)**:
   - When opened directly in a desktop browser, `mobile.html` automatically renders inside a centered phone chassis with a desktop companion toolbar (`← Return to Desktop Console`, device switcher, zoom, and raw/framed toggle).
   - When opened inside the simulator `iframe` or on an actual smartphone (`viewport < 600px`), the outer frame gracefully collapses to provide native 100% edge-to-edge mobile viewing.

---

## 3. Synchronized with Live React Production Code (`frontend/src/`)

The HTML mockups are now 100% synchronized with the live React + Vite application:

1. **Multi-Select & Floating Bulk Actions Bar**:
   - Checkbox on table header for "Select all on page" + individual row selection.
   - Selected rows highlight with soothing sapphire wash (`.selected-row`).
   - Floating bulk bar displays selected count, status update buttons (`Processing`, `Completed`, `Cancelled`), `Export CSV`, `Copy IDs`, and `Bulk Delete` (protected by Admin RBAC).
2. **In-App Confirmation Modal (`ConfirmModal`)**:
   - Zero native browser `window.confirm()` or alerts.
   - Clean, accessible in-app modal with clear warnings, order IDs, and keyboard `Esc` dismiss.
3. **In-Toast Reversible "Undo" Action**:
   - Deleting an order presents a success toast with an inline **Undo** button.
   - Clicking Undo instantly restores the order to the active table and updates telemetry without data loss.
4. **Active Role Switcher & In-App Login (`LoginModal`)**:
   - Header button group to toggle between **Admin** (`admin@sarh.ai`, Operations Manager) and **Agent** (`agent@sarh.ai`, Order Intake Agent).
   - Agent role is strictly prevented from deleting orders (RBAC enforced with immediate feedback toast).
   - Interactive login modal with quick-fill buttons and JWT simulation.
5. **Animated Count-Up Telemetry on Load**:
   - Smooth numeric animation on page load/refresh matching React's `useCountUp` hook for all 4 real metrics:
     1. **Total Orders**: `54,230`
     2. **Today's Revenue**: `142,850.00 SAR`
     3. **Pending Verification**: `412`
     4. **Completed**: `50,424`
   - Extraneous "Duplicate Protection" stat card permanently purged per PDF specification.

---

## 4. Documented Architectural Decision: Slide-Over Drawer vs. Dedicated Page

> **Product & UX Trade-off:**
> * **Decision for this task:** We implemented the order creation workflow as an in-context slide-over drawer over the orders console.
> * **Why:** Because the exact business domain and order scope are lightweight in this take-home task (intake of phone orders with 1–5 items), a slide-over drawer saves build time, keeps the underlying orders table visible in the background, and preserves active filters and pagination without re-mounting.
> * **Enterprise Scalability Caveat:** Depending on company type and order complexity (e.g. enterprise B2B workflows requiring 20+ line items, custom shipping consignments, purchase order PDF attachments, or split billing), a slide view can become cramped and frustrating for agents. For those complex scopes, a dedicated `/orders/new` full page would be the preferred design. This decision and its reasoning are documented in both [`DECISIONS.md`](file:///d:/task/Sarh_group/DECISIONS.md) and [`README.md`](file:///d:/task/Sarh_group/README.md).

---

## 5. How to Open and Review

Open [`mockups/index.html`](file:///d:/task/Sarh_group/mockups/index.html) directly in any browser:

```powershell
cd d:\task\Sarh_group\mockups
python -m http.server 3000
# Then visit: http://localhost:3000/
```
