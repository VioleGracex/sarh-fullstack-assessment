# SARH Orders Console
**صرح لحلول الأعمال | SARH Business Solutions**

An enterprise-grade, concurrency-resilient full-stack web console engineered for operations teams to manage **50,000+ orders** with sub-50ms query latency, zero duplicate submissions, and mobile-adapted ergonomics.

> **Interactive Architecture & Candidate Precedents:**  
> To inspect how core requirements (Idempotency Key locking, SQLite B-Tree indexing, `AbortController` cancellation, Zod validation, and RBAC) are grounded in production systems, open the [Candidate Technical Precedents Dossier (`TECHNICAL_PRECEDENTS.html`)](./TECHNICAL_PRECEDENTS.html) directly in any modern browser.

---

## 1. Quick Start (< 2 Minutes from Clone)

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **npm**: v9.x+

### Quick Setup & Launch

```bash
# Clone the repository
git clone https://github.com/VioleGracex/sarh-fullstack-assessment.git
cd sarh-fullstack-assessment

# 1. Install all dependencies across root, backend, and frontend
npm run install:all

# 2. Seed SQLite database with 50,000+ indexed orders & credentials
npm run seed

# 3. (Optional) Run the complete automated test suite (29 unit tests + R2 concurrency proof)
npm test

# 4. Start backend and frontend simultaneously
npm run dev
```

- **Frontend Console (Vite)**: `http://localhost:5173` *(also broadcasts on LAN for mobile devices over Wi-Fi, e.g. `http://192.168.8.4:5173`)*
- **Backend REST API (Express)**: `http://localhost:4000`

---

## 2. Seeded User Credentials (Section 3)

The application enforces a **Strict Security Gate** (`LoginPage.tsx`). Unauthenticated visitors are intercepted before any console telemetry or order data is mounted:

| Email | Password | Role | Permissions & Guardrails |
| :--- | :--- | :--- | :--- |
| **`admin@sarh.ai`** | `admin123` | **ADMIN** | Full read/write access. Authorized to execute single & bulk deletions via `DELETE /api/orders/:id`. |
| **`agent@sarh.ai`** | `agent123` | **AGENT** | Create & view orders. Deletions are strictly rejected by server-side RBAC middleware (`HTTP 403 Forbidden`). |

> **Role Switching**: You can seamlessly log in, switch users, or log out at any time using the Profile Menu in the top navigation bar.

---

## 3. System Architecture & Core Requirements Matrix

| Requirement | Implementation & Architectural Decision | Primary Files |
| :--- | :--- | :--- |
| **R1: 50,000+ Orders & Performance** | Server-side pagination (`pageSize=25` default), dynamic multi-column sorting, status filtering, and 5 dedicated SQLite B-Tree indexes. Sub-50ms response times. `AbortController` cancellation discards stale flight queries on rapid input changes. | [`backend/src/server.ts`](file:///d:/task/Sarh_group/backend/src/server.ts), [`prisma/schema.prisma`](file:///d:/task/Sarh_group/backend/prisma/schema.prisma) |
| **R2: Double-Click & Duplicate Prevention** | Client generates RFC-4122 v4 UUID `Idempotency-Key` headers on order submission. Backend employs distributed in-memory mutex locks and unique database constraints. Concurrent submissions return original record with `Idempotent-Replayed: true`. | [`backend/src/server.ts`](file:///d:/task/Sarh_group/backend/src/server.ts), [`tests/duplicate.test.ts`](file:///d:/task/Sarh_group/backend/tests/duplicate.test.ts) |
| **R3: Fast Phone Order Intake** | Low-friction slide-over drawer with real-time Zod schema validation, dynamic multi-item line rows, non-negative quantity constraints (`step="any"`), and real-time SAR tax/total calculations. | [`frontend/src/components/OrderDrawer.tsx`](file:///d:/task/Sarh_group/frontend/src/components/OrderDrawer.tsx) |
| **R4: Resilient Error Handling** | Standardized JSON error envelopes, Zod field error mapping, network offline telemetry banner (`🔴 Operations Down`), and zero unhandled Promise rejections. | [`backend/src/server.ts`](file:///d:/task/Sarh_group/backend/src/server.ts), [`frontend/src/App.tsx`](file:///d:/task/Sarh_group/frontend/src/App.tsx) |
| **R5: Instant Visual Telemetry** | Smooth animated count-up KPI metrics on initial load/refresh, live in-input search result counters, and non-blocking toast notifications. | [`frontend/src/components/StatCard.tsx`](file:///d:/task/Sarh_group/frontend/src/components/StatCard.tsx), [`frontend/src/hooks/useToast.ts`](file:///d:/task/Sarh_group/frontend/src/hooks/useToast.ts) |
| **R6: Responsive & Ergonomic UI** | Dual enterprise themes (Corporate Steel Light & Midnight Obsidian Dark), zero theme flashbang, mobile-adapted responsive card stream, sticky top controls rail, and floating thumb dock. | [`frontend/src/index.css`](file:///d:/task/Sarh_group/frontend/src/index.css), [`frontend/src/components/OrdersTable.tsx`](file:///d:/task/Sarh_group/frontend/src/components/OrdersTable.tsx) |
| **R7: Rigorous Documentation & Testing** | Comprehensive `README.md`, `DECISIONS.md`, `PROBLEMS_AND_SOLUTIONS.md` (17 challenges documented), 29 unit tests, and automated concurrency proof test. | [`PROBLEMS_AND_SOLUTIONS.md`](file:///d:/task/Sarh_group/PROBLEMS_AND_SOLUTIONS.md), [`devlog/CHANGELOG.md`](file:///d:/task/Sarh_group/devlog/CHANGELOG.md) |
| **O1 (Optional): Slow Stats & AbortController** | `GET /api/stats/slow` endpoint with configurable artificial latency. Deep Analytics Modal features a live countdown timer and instant user cancellation via `AbortController`. | [`frontend/src/components/StatsModal.tsx`](file:///d:/task/Sarh_group/frontend/src/components/StatsModal.tsx) |

---

## 4. Key Engineering & Enterprise Enhancements

Beyond the baseline requirements, the application has been engineered to production enterprise standards:

1. **Local Wi-Fi Mobile Testing via Dynamic QR Code Bridge**:
   - Backend `GET /api/network-info` detects local Wi-Fi adapter IP (`192.168.8.4`).
   - Vite dev server binds to `0.0.0.0:5173` and proxies REST traffic to port `4000`.
   - Operators can click **"Connect Mobile (Wi-Fi QR)"** in the top navigation or user menu, point their smartphone camera at the screen, and instantly test the live mobile console without typing IPs.
2. **Mobile Viewport Ergonomics (Thumb Zone Navigation)**:
   - **Sticky Top Controls Rail**: Pinned filter chips (`All`, `Pending`, `Processing`, `Completed`, `Cancelled`), full-width search, and sort controls remain docked under the header as cards scroll.
   - **Floating Mobile Operations Dock**: Thumb-accessible glassmorphic pagination pill (`‹ Prev | Page X/Y | Next ›`) and high-contrast `+ New Order` FAB.
   - **280ms Smooth Exit Transitions & Body Scroll Lock**: Bottom sheets and modals prevent background document scrolling and slide down gracefully with cubic-bezier easing.
3. **In-Toast Undo Recovery**:
   - Deleting an order (or bulk-deleting multiple orders) provides a 6-second floating toast with an interactive **"Undo"** button that immediately restores deleted records.
4. **Business Duplicate Disambiguation (ZATCA e-Invoicing Compliance)**:
   - When an operator submits an order matching an existing customer with identical amounts, the console presents an intentional confirmation dialog to distinguish between accidental double-clicks and legitimate repeat purchases.
5. **Zero-Native-Alerts Architecture & 100% Modular Typed Icons**:
   - Strictly replaced all browser-native `alert()` and `confirm()` prompts with accessible, themed modals (`ConfirmModal.tsx`).
   - Replaced all raw inline SVG strings with strongly-typed icons in `components/icons`.
6. **Security Hardening**:
   - Purged all passwords from frontend environment files (`.env`). Secrets and bcrypt verification remain strictly encapsulated on the Express backend.

---

## 5. Section 3: Code Review Findings & Fixes

Below are the 5 vulnerabilities and architectural flaws identified in the legacy contractor snippet, along with the implemented fixes:

1. **LINE 1 — HARDCODED CREDENTIALS IN SOURCE CODE (`const SECRET = ...`)**
   - *Vulnerability:* `const SECRET = "sarh-secret-2026"` was hardcoded in version-controlled source code.
   - *Fix:* Moved the secret strictly to environment variables (`process.env.JWT_SECRET`) loaded via `dotenv` with safe defaults documented in `.env.example`.
2. **LOGIN ROUTE — PLAINTEXT PASSWORDS IN DATABASE & TIMING VULNERABILITY**
   - *Vulnerability:* Direct database query comparison (`db.users.findFirst({ where: { email, password: req.body.password } })`) exposed passwords in clear text.
   - *Fix:* Salted cryptographic password hashing with `bcrypt.compare(password, user.password)`.
3. **MIDDLEWARE INPUT — TOKEN ACCEPTED FROM URL QUERY PARAMETER (`req.query.token`)**
   - *Vulnerability:* Accepting JWTs in URL query parameters leaks sensitive bearer tokens into browser histories, server access logs, and HTTP `Referer` headers.
   - *Fix:* Restricted token extraction strictly to standard `Authorization: Bearer <token>` headers.
4. **MIDDLEWARE VERIFICATION — CRYPTOGRAPHIC SIGNATURE BYPASS (`jwt.decode` vs `jwt.verify`)**
   - *Vulnerability:* `jwt.decode()` merely reads base64 payloads without cryptographic HMAC verification, allowing forged admin tokens.
   - *Fix:* Enforced cryptographic signature verification and expiration checking via `jwt.verify(token, JWT_SECRET)`.
5. **DELETE ENDPOINT — MISSING SERVER-SIDE AUTHORIZATION (CLIENT-ONLY RBAC)**
   - *Vulnerability:* Relied on client-side React components for role checking; non-admin users could delete orders directly using `curl` or Postman.
   - *Fix:* Built and applied server-side `requireRole("ADMIN")` middleware directly to `DELETE /api/orders/:id`, returning `HTTP 403 Forbidden` for unauthorized roles.

### Token Storage Reasoning
Authentication tokens are stored in client-side React state (`useState`) and transmitted via the `Authorization: Bearer <token>` header. This approach provides robust protection against **Cross-Site Request Forgery (CSRF)** because browsers never automatically attach in-memory tokens to cross-origin requests. However, like any client-accessible token storage, it requires strict protection against **Cross-Site Scripting (XSS)** through input sanitization and secure dependency management.

---

## 6. Section 5: The Product Question

> **Question:** The operations lead asks for a button: *"Delete all cancelled orders."* Before you build it, what do you ask her, and what do you propose instead if she cannot answer?

**What I ask her:**  
*"What is the underlying business driver: are cancelled orders cluttering daily operations views, causing database storage constraints, or driven by a legal/compliance retention policy?"*

**What I propose instead if she cannot answer (or insists on 'just do it'):**  
1. **For Daily View Clutter:** Introduce a persistent **"Hide Cancelled"** filter toggle and a 30-day soft-archive tab where records remain searchable and auditable.
2. **For Database Performance:** Offload historical records to an asynchronous **cold storage / data warehouse** rather than hard-deleting transactional data.
3. **For Unclear Intent:** **Escalate immediately to the compliance and accounting leads**, as permanently hard-deleting financial records destroys audit trails and violates ZATCA e-invoicing and corporate tax regulations.

---

## 7. Automated Test Suite & Concurrency Proof

### Run All Tests
```bash
npm test
```

### 1. Unit Test Suite (29 Tests)
```bash
npm run test:unit
```
Verifies server-side pagination, status filtering, dynamic sorting, Zod validation, order creation, Idempotency-Key replay headers, RBAC deletion rejection, undo/restore endpoints, and bulk operations.

### 2. R2 Concurrency & Double-Click Proof Test
```bash
npm run test:duplicate
```
Launches an ephemeral test server and fires **simultaneous parallel order requests** with identical idempotency keys to simulate real-world call-center double-clicks and network retries:
- **Request #1**: `HTTP 201 Created`
- **Request #2 (Parallel Collision)**: `HTTP 409 Conflict` (deduplicated)
- **Request #3 (Mobile Retry)**: `HTTP 201 Created` with header `Idempotent-Replayed: true`
- **Database Verification**: Confirms exactly 1 record exists in SQLite.

---

## 8. Verification Screenshots (`screenshots/`)

Automated headless Chrome CDP captures are stored in the `screenshots/` directory:

| Filename | Description | Viewport | Theme |
| :--- | :--- | :--- | :--- |
| `01-mobile-console-dark.png` | Mobile responsive card stream & KPI summary bar | 393×852 (iPhone 14/15) | Dark |
| `01b-mobile-console-scrolled-dark.png` | Sticky top controls rail & floating thumb dock (FAB + pagination) | 393×852 | Dark |
| `02-mobile-order-detail.png` | Mobile order detail bottom sheet | 393×852 | Dark |
| `03-mobile-create-order.png` | Mobile order creation intake sheet with line items | 393×852 | Dark |
| `04-mobile-console-light.png` | Mobile console card stream | 393×852 | Light |
| `04b-mobile-console-scrolled-light.png` | Scrolled mobile view with sticky controls | 393×852 | Light |
| `05-mobile-user-menu.png` | Mobile navigation menu with role switcher | 393×852 | Dark |
| `06-mobile-login-page.png` | Dedicated mobile login screen with auth telemetry | 393×852 | Dark |
| `07-desktop-qr-modal-dark.png` | Desktop Wi-Fi Mobile Connect QR code modal | 1280×800 (Desktop) | Dark |
| `08-desktop-qr-modal-light.png` | Desktop Wi-Fi Mobile Connect QR code modal | 1280×800 (Desktop) | Light |

---

## 9. What I Skipped and Why

1. **Senior Memo (`SCALE.md`):**  
   Explicitly designated in Section 5 of the specification as *"Senior applicants only"*.
2. **Heavy Docker Containers:**  
   The assessment emphasized zero-friction local execution under 5 minutes without external infrastructure. Embedded SQLite was selected for optimal reproducibility across reviewer environments.
3. **Heavy Component Libraries (MUI / AntD):**  
   Standard enterprise CSS design tokens and lightweight utility styles were used to maintain a sub-60KB CSS bundle and zero third-party component lock-in.

---

## 10. Development Ledger & Time Budget

- **Total Session Elapsed**: ~3 hours 10 minutes (`03:10:00`)
- **Assessment Maximum Hard Limit**: 5 hours (`05:00:00`)
- **Status**: 100% Core Requirements (R1–R7) + Optional O1 + Enterprise Mobile & Security Enhancements complete within budget.
- Full chronological commit history and challenge logs are preserved in [`devlog/CHANGELOG.md`](file:///d:/task/Sarh_group/devlog/CHANGELOG.md) and [`PROBLEMS_AND_SOLUTIONS.md`](file:///d:/task/Sarh_group/PROBLEMS_AND_SOLUTIONS.md).
