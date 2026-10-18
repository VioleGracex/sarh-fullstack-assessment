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

## 2. Refined UX & Search Improvements

1. **Professional Search Field**:
   - Replaced verbose count text with clean, standard enterprise placeholder:  
     `Search by order ID, customer name, email...`
2. **Clean Status & Telemetry**:
   - Removed internal developer text (`SQLite Indexed · 54,230 Rows`, `Index query: 14ms (SQLite B-Tree)`).
   - Clean, professional status badge: `Operations Live`.
3. **100% SVG Icons (Zero Emojis)**:
   - All icons are clean inline SVG paths conforming to Lucide/Feather stroke geometry.

---

## 3. Documented Architectural Decision: Slide-Over Drawer vs. Dedicated Page

> **Product & UX Trade-off:**
> * **Decision for this task:** We implemented the order creation workflow as an in-context slide-over drawer over the orders console.
> * **Why:** Because the exact business domain and order scope are lightweight in this take-home task (intake of phone orders with 1–5 items), a slide-over drawer saves build time, keeps the underlying orders table visible in the background, and preserves active filters and pagination without re-mounting.
> * **Enterprise Scalability Caveat:** Depending on company type and order complexity (e.g. enterprise B2B workflows requiring 20+ line items, custom shipping consignments, purchase order PDF attachments, or split billing), a slide view can become cramped and frustrating for agents. For those complex scopes, a dedicated `/orders/new` full page would be the preferred design. This decision and its reasoning are documented in both [`DECISIONS.md`](file:///d:/task/Sarh_group/DECISIONS.md) and [`README.md`](file:///d:/task/Sarh_group/README.md).

---

## 4. Mobile Ergonomics & Dedicated Mobile View ([`mobile.html`](file:///d:/task/Sarh_group/mockups/mobile.html))

As highlighted in the take-home brief, agents take phone orders on mobile devices under fluctuating cellular connections ("mobile networks retry"). On smartphone viewports (e.g. iPhone 14, 393px width), desktop multi-column tables and stacked stat cards fail.

We created a dedicated, responsive mobile implementation:
1. **56px Sticky Mobile App Bar**: Condenses brand crest, live pulse indicator, Light/Dark toggle, and agent avatar into a single thumb-friendly 56px bar.
2. **2×2 Compact Glanceable Micro-HUD**: Displays Revenue, Total Orders, Pending Review (with amber urgency dot), and Duplicate Shield in only 120px height (avoiding 600px of scrolling).
3. **Sticky Search & Horizontal Swipe Rail**: 44px touch-friendly search input paired with horizontally scrollable status filter chips (`All`, `Pending`, `Processing`, `Completed`, `Cancelled`).
4. **Elevated Order Card Tiles**: Replaces the desktop 8-column table with vertical, thumb-friendly card tiles. Zero horizontal panning required; tap anywhere to inspect order details.
5. **Adaptive Bottom Sheet (Create Order)**: Line items stacked vertically (Product on row 1, Quantity Stepper `[-] 2 [+]` on row 2) with a **Sticky Bottom Action Bar** anchored directly above the virtual keyboard and safe-area home indicator.
6. **Floating Action Button (FAB)**: 52px elevated pill positioned in the bottom-right natural thumb zone for instantaneous one-touch phone order intake.

---

## 5. Key Interactive Features in `index.html` & `mobile.html`

1. **Mode Switcher**: Click the Sun/Moon button to switch between **Corporate Steel (Light)** and **Midnight Obsidian (Dark)**.
2. **Device View Switcher**: In `index.html`, click **"Mobile View (393px)"** to load the dedicated mobile layout.
3. **Requirement R1 Test**: Click **"Simulate Rapid Filter (R1 Test)"** to verify `AbortController` cancellation under rapid filter clicks.
4. **Requirement R2 Test**: Click **"Register New Order"** to test UUIDv4 **Idempotency Key** generation and run the **"Simulate Rapid Double-Click"** mobile network retry proof.
5. **Order Detail Inspector**: Tap any card or row to slide open the item breakdown and idempotency audit signature.

---

## 5. How to Open and Review

Open [`mockups/index.html`](file:///d:/task/Sarh_group/mockups/index.html) directly in any browser (Chrome, Edge, Firefox, Brave) or serve via local HTTP server:

```powershell
cd d:\task\Sarh_group\mockups
python -m http.server 3000
# Then visit: http://localhost:3000/
```
