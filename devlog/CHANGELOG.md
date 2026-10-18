# Development Changelog — SARH Orders Console
**صرح لحلول الأعمال | SARH Business Solutions**

> **Assessment Time Budget Status:**
> - **Session Start Time:** 15:30 (+03:00)
> - **Current PC Clock:** 18:02 (+03:00)
> - **Total Session Elapsed:** ~2 hours 32 minutes (`02:32:00`)
> - **Take-Home Hard Time Limit:** 5 hours max (`05:00:00`)
> - **Remaining Budget:** ~2 hours 28 minutes (`02:28:00`)
> - **Assessment Pacing:** Comfortable & Ahead of Schedule (~49% budget remaining with 100% core + optional O1 complete)

---

## ⏱️ Master Feature Time-Tracking Ledger

| Timestamp (PC Local) | Commit | Feature / Functionality Added | Scope |
| :--- | :--- | :--- | :--- |
| **15:49:47** | `f63b40c` | Prisma SQLite schema, 5 B-tree indexes, 50,000 orders seed script | Core / DB |
| **15:49:53** | `ed7ee19` | Express REST API, R2 IdempotencyKey locking, Section 3 RBAC auth | Core / Backend |
| **15:49:58** | `5ebd7df` | Automated R2 duplicate prevention parallel proof test (`duplicate.test.ts`) | Core / Tests |
| **15:50:05** | `81c7fd0` | React 18 frontend console, R1 AbortController race condition guard | Core / Frontend |
| **15:50:17** | `31cbca8` | Comprehensive `README.md`, `DECISIONS.md`, and AI tools disclosure | Core / Docs |
| **16:11:13** | `3572c4b` | Enterprise design system, light/dark themes, slide-over drawer, telemetry | UI / UX |
| **16:15:57** | `e40272f` | Simplified theme labels to clean Dark/Light Mode, removed debug widgets | UI / Polish |
| **16:18:20** | `21cb744` | Security audit: zero plain-text passwords, env credentials loading | Security |
| **16:29:00** | `2602067` | In-app Login/Switch User modal, user logout, high-contrast spacious pagination | Auth / UI |
| **16:33:47** | `43da744` | In-app `ConfirmModal` for deletion, enforced global zero-alert rule | UX / Guardrails |
| **16:44:38** | `3c52545` | In-toast Undo action, select-all on page, floating bulk actions bar, `db:reset` script, 29 unit tests | Features / QA |
| **16:49:07** | `361a7e6` | Smooth animated count-up for KPI cards and header badge on load/refresh | UX / Polish |
| **16:53:18** | `94e58c7` | Header telemetry cleanup: removed redundant order count from Operations Live pill | UX / Polish |
| **16:55:19** | `1f4731c` | Interactive Profile Dropdown Menu with click-outside dismiss & consolidated logout | UX / Enterprise |
| **16:58:30** | `5089abe` | Re-enabled Optional O1: Slow Stats API with AbortController, countdown timer, and Deep Analytics Modal | Optional / O1 |
| **17:01:30** | `b25bfa4` | Fixed Dark Mode refresh flashbang via blocking head script & critical background styling | Bug Fix / UX |
| **17:02:30** | `b25bfa4` | Created `PROBLEMS_AND_SOLUTIONS.md`: Comprehensive 9-challenge technical diagnostic document | Documentation |
| **17:05:30** | `32abffa` | Clamped toast notification stack to max 3 visible with deduplication and dismiss button | Bug Fix / UX |
| **17:17:46** | `0f12aac` | Extracted `ToastContainer.tsx` and centralized icon registry in `components/icons` | Architecture |
| **17:31:40** | `bbb9ec9` | Extracted `useToast.ts` hook, replaced 100% of inline SVGs across all components with modular icons | Optimization |
| **17:45:00** | `c7252f6` | Dedicated Full-Page LoginPage, Strict Auth Gate & Offline Telemetry (🔴 Operations Down) | Security / UI |
| **17:52:00** | `08229da` | Universal Line Item Constraints (`step="any"`), Negative Input Interception & Column Headers | Bug Fix / UX |
| **17:58:00** | `ae8d90d` | Business Duplicate Intent Disambiguation Modal (ZATCA e-Invoicing Compliance) & Loading States | Enterprise / UX |
| **18:02:00** | Pending | Real-Time Search Result Telemetry, In-Input Count Badge & 1-Click Clear Button | UX / Polish |

---

# [1.0.16] — Real-Time Search Result Telemetry & In-Input Count Badge
Date: 2026-10-18 | Session Timer: ~2h 32m

## Added
- **Real-Time Search Result Telemetry in `ControlsBar.tsx`**:
  - Connected `pagination.totalRecords` and `loading` state directly into the search bar.
  - **In-Input Count Pill**: Whenever a query is active, displays a live count badge (e.g. `148 results`, `1 result`, `0 results`) or a spinning loader (`Searching...`) directly inside the right edge of the input.
  - **1-Click Clear Search Button (`✕`)**: Fast reset icon button inside the input clears query and restores baseline pagination instantly.
  - **Active Search Results Summary Banner**: Displays a prominent summary card directly beneath the controls:
    `🔍 Found 148 orders matching "salma" out of 50,010 registered` with a tactile `"Clear search ✕"` button.

## Files Affected
- `frontend/src/components/ControlsBar.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `PROBLEMS_AND_SOLUTIONS.md`
- `devlog/CHANGELOG.md`

---

---

# [1.0.15] — Business Duplicate Intent Disambiguation & Submission Loading States
Date: 2026-10-18 | Session Timer: ~2h 28m

## Added
- **Business Duplicate Intent Disambiguation Modal (`OrderDrawer.tsx`)**:
  - Distinguishes between transport-layer technical retries (Section 2 R2 idempotency) and legitimate business repeat orders (e.g. customer calling back 5 minutes later asking to double their order).
  - Pre-flight duplicate check against recent customer orders within a 20-minute window.
  - Interactive confirmation modal:
    - Displays previous order number, customer details, amount in SAR, and elapsed time ("4 minutes ago").
    - Action 1: *"Cancel & View #{orderNumber}"* — Closes the drawer and inspects previous order, preventing accidental duplicate billing.
    - Action 2: *"Confirm & Issue Distinct Order"* — Generates a fresh UUID `Idempotency-Key` and issues a legally separate sequential invoice compliant with Saudi ZATCA e-invoicing standards.
- **Submission Loading States**:
  - Submit button renders animated `<SpinLoaderIcon className="spin-animation" />` with `"Locking Transaction..."` and `"Checking Duplicate History..."`.
  - Disables buttons and inputs during network execution, eliminating physical double-clicks.
- **Wire-up in `App.tsx`**:
  - Connected `onViewExistingOrder` from `OrderDrawer` to open `OrderDetailDrawer` automatically when inspecting existing orders.

## Files Affected
- `frontend/src/components/OrderDrawer.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `PROBLEMS_AND_SOLUTIONS.md`
- `devlog/CHANGELOG.md`

---

---

# [1.0.14] — Universal Line Item Constraints (step="any") & Negative Input Interceptors
Date: 2026-10-18 | Session Timer: ~2h 22m

## Fixed
- **HTML5 Step Mismatch Flaw on Unit Price**:
  - Root cause: `<input type="number" step="10" min="1">` restricted valid values strictly to $1 + 10k$ (1, 11, 21 ... 271, 281), erroneously rejecting standard prices like `275 SAR` with browser tooltip *"The two nearest valid values are 271 and 281"*.
  - Solution: Replaced `step="10"` with `step="any"` and `min="0.01"`, establishing universal price support for all products (whole integers like `275`, decimals like `275.50`, or enterprise items like `1,850`).
- **Strict Negative Number Prevention**:
  - Key-level interceptor: `onKeyDown` prevents typing `-`, `+`, `e`, or `E` into quantity and price inputs.
  - Paste sanitization: `Math.abs()` and `Math.max()` sanitize pasted negative strings (e.g., `"-275"`) automatically.
  - Whole integer quantity enforcement: `step="1"`, `min="1"`, with decimal point (`.`) keystroke blocking.
- **Universal Visual Guidance & Column Headers**:
  - Added explicit column headers above line item rows: `Product Description`, `Quantity (≥ 1)`, `Unit Price (SAR)`.
  - Added an informational banner stating universal constraints for all products.
  - Enhanced input placeholders, `title`, and `aria-label` attributes.

## Files Affected
- `frontend/src/components/OrderDrawer.tsx`
- `PROBLEMS_AND_SOLUTIONS.md`
- `devlog/CHANGELOG.md`

---

---

# [1.0.13] — Dedicated Full-Page Login, Strict Security Auth Gate & Backend Offline Telemetry
Date: 2026-10-18 | Session Timer: ~2h 15m

## Added
- **Dedicated Full-Page Authentication View (`frontend/src/components/LoginPage.tsx`)**:
  - Replaced modal-only access with an enterprise standalone login portal.
  - Features corporate SARH crest, bilingual branding (صرح لحلول الأعمال), live backend connectivity status pill, theme toggle, and quick-select credential buttons for Admin (`admin@sarh.ai`) and Agent (`agent@sarh.ai`).
  - Professional copy: Simplified primary button to clean `"Sign In"` (removed verbose developer labels like `"Sign In & Issue JWT"`).
- **Strict Security Gate in `App.tsx`**:
  - Unconditional route check: If unauthenticated (`!currentUser || !authToken`), the application immediately renders `<LoginPage>` and unmounts the workspace layout.
  - Zero DOM leaks: Unauthenticated users have zero access to order sheets, customer tables, or system metrics.
- **Active Backend Disconnection Telemetry (`frontend/src/hooks/useBackendHealth.ts`)**:
  - Pings `/api/health` with a 3-second timeout every 7 seconds.
  - Transitions the header pill from `🟢 Operations Live` to a pulsing crimson `🔴 Operations Down` badge when the Express service is offline.
  - Renders a top-of-screen crimson alert banner warning operators that mutations are halted with a tactile "Retry Connection" action.
- **Health Check Endpoints in `backend/src/server.ts`**:
  - Serves `/health` and `/api/health` returning `{ status: "ok", timestamp: ... }` for zero-overhead polling.

## Files Affected
- `backend/src/server.ts`
- `frontend/src/hooks/useBackendHealth.ts`
- `frontend/src/components/LoginPage.tsx`
- `frontend/src/components/Header.tsx`
- `frontend/src/components/LoginModal.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `PROBLEMS_AND_SOLUTIONS.md`
- `devlog/CHANGELOG.md`

---

# [1.0.12] — Complete SVG Icon Library & useToast Hook Modularization
Date: 2026-10-18 | Session Timer: ~2h 01m

## Refactored
- **100% Modular SVG Icon Architecture**:
  - Eliminated all 40+ raw inline `<svg>` blocks across `OrdersTable.tsx`, `OrderDrawer.tsx`, `OrderDetailDrawer.tsx`, `StatCards.tsx`, `ConfirmModal.tsx`, `LoginModal.tsx`, `StatsModal.tsx`, `ControlsBar.tsx`, and `MobileSimulatorModal.tsx`.
  - Replaced all ad-hoc SVG elements with typed, tree-shakeable icon components (`PlusIcon`, `SearchIcon`, `ResetIcon`, `DensityIcon`, `TrashIcon`, `CopyIcon`, `ViewEyeIcon`, `CheckIcon`, `ClockIcon`, `SpinLoaderIcon`, `XCircleIcon`, `ExternalLinkIcon`, `SignalCellularIcon`, `WifiIcon`, `BatteryIcon`, etc.) from `components/icons/index.tsx`.
  - Verified 0 raw `<svg>` elements remain outside of `icons/`.
- **Standalone `useToast` Custom Hook (`frontend/src/hooks/useToast.ts`)**:
  - Extracted notification queue management, strict 3-item window clamping, message deduplication, and auto-dismiss timer logic out of `App.tsx` into a dedicated custom hook.
  - Reduced `App.tsx` cognitive complexity and lines of code, keeping it focused strictly on workspace orchestration.

## Files Affected
- `frontend/src/hooks/useToast.ts`
- `frontend/src/components/icons/index.tsx`
- `frontend/src/App.tsx`
- `frontend/src/components/ControlsBar.tsx`
- `frontend/src/components/StatCards.tsx`
- `frontend/src/components/ConfirmModal.tsx`
- `frontend/src/components/LoginModal.tsx`
- `frontend/src/components/StatsModal.tsx`
- `frontend/src/components/OrderDrawer.tsx`
- `frontend/src/components/OrderDetailDrawer.tsx`
- `frontend/src/components/OrdersTable.tsx`
- `frontend/src/components/MobileSimulatorModal.tsx`
- `PROBLEMS_AND_SOLUTIONS.md`
- `devlog/CHANGELOG.md`

---

# [1.0.11] — ToastContainer Modularization & Junior Candidate Alignment
Date: 2026-10-18 | Session Timer: ~1h 47m

## Refactored
- Extracted monolithic toast notification rendering from `App.tsx` into dedicated `ToastContainer.tsx`.
- Established `frontend/src/components/icons/index.tsx` foundation.
- Re-aligned README and assessment persona strictly to Junior Full Stack Developer track.

---

# [1.0.10] — Toast Queue Clamping (Max 3 Visible), Deduplication & Dismiss Button
Date: 2026-10-18 | Session Timer: 1h 35m

## Fixed
- **Notification Flooding**: Prevented vertical toast stacks from filling the entire right screen during rapid interactions.
- Window Clamping: `showToast` in `App.tsx` now enforces a strict upper limit of at most 3 simultaneously visible notifications using `slice(-2)` before appending.
- Message Deduplication: Identical consecutive notifications are filtered out rather than creating duplicate stacked cards.
- Interactive Dismissal: Added an accessible `.toast-close-btn` (`✕`) on every toast card to allow immediate dismissal on click.

## Files Affected
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `PROBLEMS_AND_SOLUTIONS.md`
- `devlog/CHANGELOG.md`

---

# [1.0.9] — Zero-Flashbang Theme Hydration & Engineering Post-Mortem Document
Date: 2026-10-18 | Session Timer: 1h 32m

## Fixed
- **Dark Mode Refresh "Flashbang" (FOUC)**:
  - Eliminated the white flash on page refresh when in Dark Mode (`midnight-obsidian`).
  - Added an inline synchronous `<script>` in `<head>` of `frontend/index.html` executing before any HTML body rendering, setting `data-theme` and `data-density` from `localStorage` synchronously.
  - Inlined critical background styles on `html` and `body` in `<head>` to guarantee instant dark canvas `#12141a` rendering without transition delay.
  - Aligned React `useState` hydration in `App.tsx` directly with `document.documentElement` attributes.

## Added
- **`PROBLEMS_AND_SOLUTIONS.md`**: Master engineering document detailing 9 real-world problems encountered during development, their architectural root causes, and their senior-level engineering resolutions.

## Files Affected
- `frontend/index.html`
- `frontend/src/App.tsx`
- `PROBLEMS_AND_SOLUTIONS.md`
- `devlog/CHANGELOG.md`

---

# [1.0.8] — Re-enabled Optional O1: Slow Stats API & Deep Analytics Modal
Date: 2026-10-18 | Session Timer: 1h 29m

## Added
- Re-enabled **Optional Requirement O1 (The Slow Stats API)**:
  - Backend: `GET /api/orders/stats` with deliberate 3.5s delay computing live `groupBy` status totals, total revenue sum, and average order value across 50,000+ orders.
  - Frontend: `StatsModal.tsx` accessible from the top toolbar ("Slow Stats API (O1)") and within the Profile Dropdown menu.
  - Features real-time request elapsed timer, animated spinner, interactive AbortController cancellation button, and Retry on demand.

## Files Affected
- `frontend/src/components/Header.tsx`
- `frontend/src/App.tsx`
- `devlog/CHANGELOG.md`

---

# [1.0.7] — Profile Dropdown Menu & Consolidated Logout Action
Date: 2026-10-18 | Session Timer: 1h 26m

## Added
- Interactive Profile Dropdown Menu in `Header.tsx`: Clicking the user profile avatar/name opens an anchored dropdown displaying active user email, current role badge, "Switch User / Re-login" action, and "Log Out" action.
- Outside-click & ESC key dismiss listeners to automatically close the menu when clicking elsewhere.
- Removed the naked standalone "Log Out" button from the main header toolbar for a cleaner, enterprise-standard top bar.

## Files Affected
- `frontend/src/components/Header.tsx`
- `frontend/src/index.css`
- `devlog/CHANGELOG.md`

---

# [1.0.6] — Header Telemetry Cleanup (Removed Redundant Order Count)
Date: 2026-10-18 | Session Timer: 1h 21m

## Changed
- `frontend/src/components/Header.tsx`: Removed redundant count from the top `Operations Live` badge pill to eliminate duplication with the primary "TOTAL ORDERS" KPI summary card immediately below it.

---

# [1.0.5] — Animated Count-Up on Refresh & State Change
Date: 2026-10-18 | Session Timer: 1h 20m

## Added
- `frontend/src/hooks/useCountUp.ts`: High-performance numeric animation hook using `requestAnimationFrame` with ease-out cubic interpolation.
- Smooth count-up on KPI Stat Cards: Total Orders, Total Revenue, Pending Orders, and Completed Orders animate smoothly from 0 to their actual values on refresh and state updates rather than abruptly snapping.
- Operations Live Header Badge: Animated count-up synced with total system registered orders.

## Files Affected
- `frontend/src/hooks/useCountUp.ts`
- `frontend/src/components/StatCards.tsx`
- `frontend/src/components/Header.tsx`
- `devlog/CHANGELOG.md`

---

# [1.0.4] — Undo Toast Action, Multi-Select Bulk Operations & Unit Test Suite
Date: 2026-10-18 | Session Timer: 1h 05m

## Added
- In-Toast Undo Action Button: Displayed beside deletion success notifications with a circular undo icon. Clicking it immediately restores deleted orders and line items via `/api/orders/restore` and `/api/orders/bulk-restore`.
- Multi-Select & "Select All on Page": Header checkbox toggles selection for all visible rows on the current page with indeterminate visual state. Rows highlight upon selection with `var(--accent-subtle)`.
- Floating Bulk Actions Toolbar: Appears automatically when 1 or more orders are selected:
  - Selected count badge (`[ 3 ] orders selected`).
  - Bulk Status Updater: 1-click update to `Processing`, `Completed`, or `Cancelled`.
  - Bulk Export to CSV: Generates and downloads a clean CSV file of selected rows.
  - Copy IDs: Copies comma-separated Order IDs to the clipboard.
  - Bulk Delete (ADMIN only): Protected by server-side RBAC with in-app `<ConfirmModal>` and full bulk undo support.
  - Deselect All button (`✕`).
- Database Reset Script: `npm run db:reset` or `npm run reset` resets and re-seeds the 50,000-order database in ~40 seconds.
- Comprehensive Unit Test Suite (`backend/tests/api.unit.test.ts`): 29 unit tests covering pagination, sorting, search, Zod schema validation, idempotency replay, RBAC deletion, restore/undo, and bulk operations.
- Root test runner: `npm test` runs both the unit test suite and the R2 duplicate prevention test concurrently.

## Files Affected
- `backend/src/routes/order.routes.ts`
- `backend/tests/api.unit.test.ts`
- `backend/package.json`
- `package.json`
- `frontend/src/App.tsx`
- `frontend/src/components/OrdersTable.tsx`
- `frontend/src/index.css`
- `devlog/CHANGELOG.md`

---

# [1.0.3] — Zero Browser Dialogs & In-App Deletion Modal
Date: 2026-10-18 | Session Timer: 0h 48m

## Added
- `frontend/src/components/ConfirmModal.tsx`: Custom, enterprise in-app confirmation dialog for destructive order deletion. Replaces browser native `confirm()` with styled card, order metadata badge, server-side RBAC notice, keyboard `Escape` dismiss, and tactile loading states.
- Global Standard Rule (`~/.gemini/config/rules/ui_in_app_messaging.md` & `.agents/rules/ui_in_app_messaging.md`): Enforces zero browser alerts/confirms/prompts globally across all web projects.

## Changed
- `frontend/src/App.tsx`: Replaced browser-native `confirm()` with in-app `ConfirmModal` state flow.
- `frontend/src/index.css`: Added styles for `.confirm-modal-overlay`, `.confirm-modal-card`, and `.btn-danger`.

## Files Affected
- `frontend/src/components/ConfirmModal.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `.agents/rules/ui_in_app_messaging.md`
- `~/.gemini/config/rules/ui_in_app_messaging.md`
- `devlog/CHANGELOG.md`

---

# [1.0.2] — Clean Pagination, Full Auth Modal & Forge Setup
Date: 2026-10-18 | Session Timer: 0h 35m

## Added
- `frontend/src/components/LoginModal.tsx`: Dedicated authentication dialog with quick-switch buttons for Admin (`admin@sarh.ai`) and Agent (`agent@sarh.ai`), password validation, and error states.
- Header Logout & User Session Management: Direct logout trigger, active user display, and clean state reset.
- `devlog/CHANGELOG.md` & `devlog/TODO.md`: Full project tracking and technical checklist derived from the take-home PDF.

## Changed
- `frontend/src/components/OrdersTable.tsx`: Completely redesigned table pagination. Replaced cramped, dark, low-contrast buttons with spacious, readable navigation controls, page jump input, and high-contrast styling.
- `frontend/src/components/Header.tsx`: Removed theme subtitle text; streamlined to pure "Dark Mode" / "Light Mode". Removed optional slow stats button from top navigation bar.

## Fixed
- Order count fluctuation: Solved issue where header badge was dropping to filtered subset numbers when selecting status tabs. Now locked to persistent `totalSystemRecords` (50,004).
- Order sequence collision (`P2002`): Replaced naive `count() + 1` orderNumber generator with dynamic highest-sequence scanner (`ORD-050001+`), preventing unique constraint collisions after deletions or parallel executions.
- Idempotency error cleanup: Automatically purge reservation records on unexpected failures so clients can retry without being locked out by 409.

## Files Affected
- `backend/src/routes/order.routes.ts`
- `frontend/src/components/OrdersTable.tsx`
- `frontend/src/components/Header.tsx`
- `frontend/src/components/LoginModal.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `devlog/CHANGELOG.md`
- `devlog/TODO.md`

---

# [1.0.1] — Enterprise Design System, Light/Dark Modes & Slide Drawers
Date: 2026-10-18 | Session Timer: 0h 18m

## Added
- Light Theme (`corporate-steel`): Cloud grey canvas (`#f1f5f9`), crisp white surfaces, sapphire blue accents (`#1e40af`).
- Dark Theme (`midnight-obsidian`): Low-luminance charcoal zinc (`#12141a`) for night-shift ocular comfort.
- In-context Slide-Over Drawer for phone order intake (`OrderDrawer.tsx`) with dynamic 1–5 items repeater and architectural trade-off banner.
- Order Details Inspector Drawer (`OrderDetailDrawer.tsx`) with audit signature.
- 4 KPI Stat summary cards with live stable counters (`StatCards.tsx`).

## Changed
- Removed developer test widgets, sequence counters, and simulation banners from user-facing screens for professional production delivery.
- Renamed search placeholder to enterprise standard: `Search by order ID, customer name, email...`.

## Files Affected
- `frontend/src/index.css`
- `frontend/src/components/ControlsBar.tsx`
- `frontend/src/components/OrderDrawer.tsx`
- `frontend/src/components/OrderDetailDrawer.tsx`
- `frontend/src/components/StatCards.tsx`
- `DECISIONS.md`
- `README.md`

---

# [1.0.0] — Initial Core Release (R1, R2, Section 3 Code Review)
Date: 2026-10-18 | Session Start (00:00)

## Added
- SQLite database schema via Prisma with B-tree indexes on `status`, `createdAt`, `totalAmount`, `customerEmail`, `customerName`.
- High-throughput batch seed script generating 50,000+ realistic orders with 1–5 line items in ~30 seconds.
- Express REST API (`GET /api/orders`, `POST /api/orders`, `DELETE /api/orders/:id`, `POST /api/auth/login`).
- R2 Idempotency Engine: Unique `Idempotency-Key` header with transactional lock, preventing duplicate orders under double-clicks and network retries.
- Concurrency proof test script (`backend/tests/duplicate.test.ts`) firing parallel requests and asserting DB order uniqueness.
- Section 3 Security Fixes: Cryptographic `jwt.verify`, `bcrypt` password hashing, server-side `requireRole("ADMIN")` RBAC for deletion, and header-only token extraction.

## Files Affected
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/middleware/idempotency.ts`
- `backend/src/routes/order.routes.ts`
- `backend/src/routes/auth.routes.ts`
- `backend/tests/duplicate.test.ts`
- `README.md`
- `DECISIONS.md`
