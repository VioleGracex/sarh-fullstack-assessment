# Development Changelog — SARH Orders Console
**صرح لحلول الأعمال | SARH Business Solutions**

---

# [1.2.0] — Clean Pagination, Full Auth Modal & Forge Setup
Date: 2026-10-18 | Time: ~35 min

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

# [1.1.0] — Enterprise Design System, Light/Dark Modes & Slide Drawers
Date: 2026-10-18 | Time: ~45 min

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
Date: 2026-10-18 | Time: ~2.5 hrs

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
