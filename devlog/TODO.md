# Master Technical Checklist — SARH Orders Console
**Derived from Take-Home Technical Assessment V2 (Junior Full Stack Developer)**

---

## 1. Core Build Tasks (Mandatory)

### R1: Large List that Stays Fast and Stays Correct
- [x] **50,000+ Database Rows**: Seed script creates 50,000+ realistic orders with 1–5 line items in ~30s.
- [x] **Server-Side Pagination**: Implemented limit/offset pagination in Express + Prisma; never sends the full table to the browser.
- [x] **Indexed Database Queries**:
  - [x] `@@index([status])`
  - [x] `@@index([createdAt])`
  - [x] `@@index([totalAmount])`
  - [x] `@@index([customerEmail])`
  - [x] `@@index([customerName])`
  - [x] Mentioned in documentation and schema.
- [x] **Search & Filters**: Customer name, email, order ID search + status filtering (`PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`).
- [x] **Sorting**: Created date (newest/oldest), total amount (high/low), and order number.
- [x] **Race Condition Defense (Rapid Filter Switch)**:
  - [x] `AbortController` in `useOrders.ts` automatically aborts pending in-flight requests when filters change rapidly.
  - [x] Monotonic request sequence IDs drop any stale responses returning out-of-order.
  - [x] Slower previous requests can never overwrite the latest selected filter.

### R2: Create Order — Zero Duplicates, Ever
- [x] **Order Intake Form**: Form capturing customer name, email, status, and 1–5 line items with quantities and unit prices.
- [x] **Dual Validation**:
  - [x] Client-side input validation before transmission.
  - [x] Server-side validation with Zod schemas.
- [x] **Server-Enforced Concurrency Guarantee**:
  - [x] Client generates unique `Idempotency-Key` (UUIDv4) per order intake attempt.
  - [x] Server reserves key with transactional lock in `IdempotencyRecord` table.
  - [x] Concurrent requests return `HTTP 409 Conflict`.
  - [x] Subsequent retries replay the cached original order with `Idempotent-Replayed: true`.
- [x] **R2 Concurrency Proof Script**:
  - [x] Automated test script (`npm run test:duplicate` / `backend/tests/duplicate.test.ts`).
  - [x] Fires 2 simultaneous requests in parallel via `Promise.all` with identical idempotency key.
  - [x] Asserts directly in SQLite database that **exactly one order exists**.

---

## 2. Code Review Task (Mandatory Section 3)

- [x] **Identify Vulnerabilities in Legacy Contractor Snippet**:
  - [x] Flaw 1: `jwt.decode` without signature verification (allows forged tokens).
  - [x] Flaw 2: Client-only admin check on `DELETE /orders/:id` (broken server access control).
  - [x] Flaw 3: Plain-text password comparison in database query.
  - [x] Flaw 4: Token accepted in URL query parameter `req.query.token` (logs leakage).
  - [x] Flaw 5: Hardcoded `SECRET` string in application code.
- [x] **Implement Fixed Auth Middleware & Routes**:
  - [x] `requireAuth` using cryptographic `jwt.verify(token, JWT_SECRET)`.
  - [x] Header-only token extraction: `Authorization: Bearer <token>`.
  - [x] Salted password hashing and verification using `bcryptjs`.
  - [x] Server-side `requireRole("ADMIN")` RBAC protecting `DELETE /api/orders/:id`.
  - [x] Seeded required users: `admin@sarh.ai` (`ADMIN`) and `agent@sarh.ai` (`AGENT`).
- [x] **Token Storage Analysis**:
  - [x] Documented in `README.md` (memory token vs. httpOnly cookie, XSS vs. CSRF trade-offs).

---

## 3. UI, Polish & User Experience

- [x] **Appearance Themes**:
  - [x] Light Mode: Corporate Steel & Sapphire (`corporate-steel`).
  - [x] Dark Mode: Midnight Obsidian & Zinc (`midnight-obsidian`).
  - [x] Clean SVG Sun/Moon toggle button on top bar.
- [x] **Density Modes**: 1-click toggle between Comfortable and Compact layout.
- [x] **Clean Enterprise Telemetry**:
  - [x] Removed developer test boxes, simulation banners, and abort counters.
  - [x] Persistent stable system order count (`Operations Live · 50,004 Orders`).
- [x] **Slide-Over Drawers**:
  - [x] Order Registration Drawer with 1–5 items repeater and idempotency lock signature.
  - [x] Order Detail Inspector Drawer with receipt/itemized view.
- [x] **User Session & Auth UI**:
  - [x] Active role toggle (`ADMIN` / `AGENT`).
  - [x] Dedicated Login / Switch User dialog with quick-fill credentials.
  - [x] User logout capability.
- [x] **Pagination UX Redesign**:
  - [x] High-contrast, spacious page controls.
  - [x] Direct page jump input (`Page [ 1 ] of 2,001`).
  - [x] Clean Next/Previous navigation with clear item count indicators.

---

## 4. Written Answers & Documentation (Mandatory)

- [x] **`README.md`**:
  - [x] Setup, seed, and test commands (runs in < 2 minutes).
  - [x] Seeded user credentials table.
  - [x] Code review findings (Section 3).
  - [x] Token storage security analysis.
  - [x] Product question answer: "Delete all cancelled orders" (5 lines maximum, asking "Why" before "How").
  - [x] "What I skipped and why" section (Senior memo, complex Docker).
- [x] **`DECISIONS.md`**:
  - [x] Decision 1: R2 Idempotency Key approach vs. naive DB constraints.
  - [x] Decision 2: SQLite vs. PostgreSQL strategy.
  - [x] Decision 3: `AbortController` cancellation vs. input debouncing.
  - [x] Additional Decision 4: Slide-Over Drawer vs. Dedicated Page (`/orders/new`).
  - [x] Transparent AI Tools disclosure.
- [x] **Git Repository**:
  - [x] Clean, semantic Conventional Commits history (`feat:`, `test:`, `docs:`, `style:`).
  - [x] Sensitive files (`.env`, `*.db`) excluded via `.gitignore`.
  - [x] `.env.example` committed.

---

## 5. Submission Artifacts (Section 7)

- [ ] **Git Repository Link**: Push to GitHub (public or grant access to `m.alharbi@sarh.ai`).
- [ ] **Visual Proof**:
  - [ ] Screenshot 1: 50,000+ orders list with search, filter, and dark/light mode.
  - [ ] Screenshot 2: Slide-over drawer with line items and idempotency key.
  - [ ] Screenshot 3: Terminal output of `npm run test:duplicate` proving R2 duplicate prevention.
  - *(Or short 2-minute screen recording).*
