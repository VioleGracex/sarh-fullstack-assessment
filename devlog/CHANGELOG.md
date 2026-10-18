# Development Changelog — SARH Orders Console
**صرح لحلول الأعمال | SARH Business Solutions**

> **Assessment Time Budget Status:**
> - **Session Start Time:** 15:30 (+03:00)
> - **Current PC Clock:** 16:59 (+03:00)
> - **Total Session Elapsed:** ~1 hour 29 minutes (`01:29:00`)
> - **Take-Home Hard Time Limit:** 5 hours max (`05:00:00`)
> - **Remaining Budget:** ~3 hours 31 minutes (`03:31:00`)
> - **Assessment Pacing:** Comfortable & Ahead of Schedule (~70% budget remaining with 100% core + optional O1 complete)

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
