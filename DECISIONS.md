# Architectural Decisions & AI Disclosure

This document outlines the three primary engineering trade-offs evaluated during the development of the SARH Orders Console, followed by a transparent disclosure of AI tool usage.

---

## Decision 1: Duplicate Order Prevention (R2 Approach)

* **The Decision:**  
  We implemented client-generated `Idempotency-Key` headers (UUIDv4) coupled with server-side transactional key reservation in an `IdempotencyRecord` table. If a key is currently `PROCESSING`, concurrent attempts receive `HTTP 409 Conflict`. Once `RESOLVED`, identical retries receive the cached original order with an `Idempotent-Replayed: true` header.
* **Alternative Considered:**  
  Client-side button disabling combined with a database composite unique constraint on `(customerEmail, totalAmount, date_trunc('minute', createdAt))`.
* **Why We Rejected It:**  
  Client button disabling only protects against rapid UI double-clicks, leaving the system completely vulnerable to automated mobile network retries and browser timeout resends. Furthermore, composite unique constraints on business data risk false-positive blocks when a customer legitimately places two identical orders back-to-back. The explicit idempotency key cleanly separates network retry identity from business payload integrity.

---

## Decision 2: Database Strategy — SQLite via Prisma vs. PostgreSQL

* **The Decision:**  
  We selected SQLite (file-backed relational database) managed through Prisma ORM, configured with WAL mode and dedicated B-Tree indexes on `status`, `createdAt`, `totalAmount`, and customer details.
* **Alternative Considered:**  
  A containerized PostgreSQL instance using `docker-compose.yml`.
* **Why We Rejected It:**  
  While PostgreSQL is our preferred architecture for enterprise production (supporting multi-master replication and fine-grained `FOR UPDATE` row-level locks), requiring Docker or a local PostgreSQL daemon introduces external dependency friction for the reviewer. The assessment explicitly prioritizes a frictionless setup that runs in under 5 minutes without requiring Docker. SQLite delivers real disk persistence, foreign key integrity, and sub-50ms query times over 50,000 rows with zero configuration.

---

## Decision 3: Race Condition Defense — AbortController & Sequence Tokens vs. Debouncing

* **The Decision:**  
  We implemented native browser `AbortController` cancellation paired with a monotonic request sequence ID (`latestRequestIdRef`) inside the `useOrders` custom hook. Any previous in-flight fetch is cancelled immediately before issuing a new filter request.
* **Alternative Considered:**  
  Simple input debouncing (e.g. `lodash.debounce` with a 300ms delay) without request cancellation.
* **Why We Rejected It:**  
  Debouncing merely delays the trigger of a request; it does not solve network inversion (where an earlier slow query over a large dataset takes 1,200ms and returns *after* a fast 150ms query). If an agent switches filters in quick succession, an earlier slow response can still overwrite the screen with stale data. Combining `AbortController` with monotonic sequence checks guarantees that stale responses are cancelled at the browser network layer and never update the DOM.


---

## Additional UI/UX Architecture Decision: Order Creation View — Slide-Over Drawer vs. Dedicated Page (`/orders/new`)

* **The Decision:**  
  We implemented the order creation workflow as an in-context slide-over drawer over the main orders console rather than navigating away to a dedicated full-page form (`/orders/new`).
* **Alternative Considered:**  
  A separate full-screen page route (`/orders/new`) with multi-step stepper navigation.
* **Why We Decided & Scoped It:**  
  The exact business domain, operational scope, and line-item complexity are not explicitly defined in the brief beyond taking phone orders with 1–5 items. In this operational context, a slide-over drawer keeps the underlying orders table visible in the background, preserves active filter/search/pagination state without re-mounting, and saves substantial developer build time. However, we acknowledge that depending on company type—particularly enterprise B2B workflows requiring 20+ line items, custom shipping consignments, purchase order PDF uploads, or split invoicing—a side drawer can feel cramped and annoying for operators. For complex enterprise scopes, a dedicated `/orders/new` page would be the superior architecture; we retained the drawer here specifically to prioritize high-speed phone intake and focus on the core backend concurrency guarantees within the take-home time budget.

---

## Additional UI/UX Architecture Decision: Mobile Operations Architecture — Order Card Tiles vs. 8-Column Tables

* **The Decision:**  
  For mobile viewports (e.g. iPhone 14, 393px × 852px), we replace the desktop 8-column `<table>` with vertical **Elevated Order Card Tiles**, condense the stacked KPI cards into a 2×2 glanceable micro-HUD, convert status tabs into a horizontal swipe rail, and adapt the order creation drawer into a thumb-friendly **Bottom Sheet** with sticky submit footer.
* **Alternative Considered:**  
  Keeping the desktop `<table>` inside an `overflow-x: auto` container or aggressively hiding 5 of the 8 columns on mobile.
* **Why We Rejected It:**  
  The brief explicitly highlights mobile operations and mobile network retries ("agents double-click, mobile networks retry"). In a high-velocity operations environment where agents take phone orders on a smartphone while walking warehouse floors, horizontally scrolling an 8-column table causes constant disorientation, accidental edge-swipe back navigation, and high mis-tap rates on small 20px action buttons. Card tiles present Order ID, customer, line item summary, status badge, and total SAR amount in a single readable vertical scan with generous 44×44px touch targets. Furthermore, the bottom sheet keeps the Grand Total and "Create Order" button anchored right above the iOS/Android virtual keyboard, preventing the submit action from being obscured.

---

## AI Tools Disclosure & Architectural Provenance

In accordance with Section 5 and the technical constraints of the brief:

* **Tools Used:** Antigravity AI (Google DeepMind)
* **What AI was used for:**
  - Scaffolding boilerplate TypeScript interfaces and Prisma models.
  - Accelerating the high-throughput batch transaction seed script to generate 50,000+ orders with 1–5 line items in ~30 seconds.
  - Writing the automated `duplicate.test.ts` concurrency proof script to simulate parallel `Promise.all` requests.
  - Reviewing and validating edge cases for the Section 3 security code review (OWASP A01 access control, JWT cryptographic verification).

* **Developer Ownership & Prior Experience:**  
  All architectural decisions, trade-offs, database indexing designs, and code structures were reviewed, verified, tested, and defended by the author. AI was utilized as a velocity accelerator for typing and scaffolding, **not as a substitute for domain expertise**. 
  
  Every core architectural pattern in this solution—including distributed `Idempotency-Key` locking, SQLite WAL B-Tree index optimization, `AbortController` network cancellation, and cryptographic JWT verification—is directly grounded in production systems I previously architected and shipped.

* **Interactive Provenance Dossier:**  
  For complete transparency, an interactive dossier mapping each requirement of this assessment to working code excerpts from my previous projects can be reviewed in:  
  **[`TECHNICAL_PRECEDENTS.html`](./TECHNICAL_PRECEDENTS.html)** *(Open directly in any web browser)*.

