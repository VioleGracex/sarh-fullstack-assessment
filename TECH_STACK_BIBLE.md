# TECH STACK BIBLE & PROJECT BOUNDARIES

> **Project:** Orders Console (SARH Business Solutions Technical Assessment V2)  
> **Role Level:** **Junior Full Stack Developer (React)**  
> **Deadline:** Thursday, 22 October 2026  
> **Core Principle:** "Built to endure — We care more about how you think than how much you build."

---

## 1. Allowed vs. Forbidden Matrix

| Area | APPROVED & REQUIRED | STRICTLY FORBIDDEN / WHAT NOT TO DO |
|---|---|---|
| **Role Scope** | **Junior requirements only** (R1, R2, Code Review, DECISIONS.md, README.md) | **DO NOT write `SCALE.md`** (Design memo is for Senior applicants only). |
| **Database** | **SQLite (file-backed real database via Prisma ORM)**. Real tables, foreign keys, B-tree indexes, transactions. | **NO in-memory arrays or mock databases** (Explicitly rejected: *"In-memory is not acceptable"*).<br>**NO complex cloud-hosted databases** requiring external credentials. |
| **Backend** | **Node.js (Express + TypeScript)**. Clean REST API. | **NO non-Node backends** (No Python/Django, Go, Java).<br>**NO bloated, over-engineered architectures** you cannot modify live during the interview. |
| **Frontend** | **React 18+ with TypeScript (Vite)** + Tailwind CSS for clean layout. | **NO Vue, Angular, Svelte, or vanilla JS**.<br>**NO massive UI component libraries** (e.g. AntD, MUI) that bloat bundle or hide logic. |
| **Services / Hosting** | **100% Local execution**. Must boot cleanly from README commands in under 5 minutes. | **NO paid services or external third-party dependencies** (No paid SaaS APIs, no AWS/GCP setups). |
| **Secrets & Config** | Commit `.env.example`. Seeded passwords plain in README. | **NEVER commit a real `.env` file** to git. |
| **AI Usage** | **Allowed & expected**. Must be fully disclosed in `DECISIONS.md`. | **DO NOT hide AI use**. Evaluators read `DECISIONS.md` first and test code understanding live. |
| **Visual Design** | Clean, readable, functional dashboard UI. | **NO spending hours on pixel-perfect CSS**. The rubric says: *"What it does not need: pixel-perfect design, Docker, full test coverage."* |

---

## 2. Selected Technical Stack

### **Frontend**
- **Runtime & Bundler:** Vite
- **Framework:** React 18+
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (simple, utility-first, minimal overhead)
- **Icons:** Lucide React (clean, lightweight)
- **State & Query Strategy:** Native `fetch` / custom hook with `AbortController` (strictly proves request cancellation for R1 without magic library shielding)

### **Backend**
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Language:** TypeScript (`ts-node-dev` / `tsx` for hot-reload)
- **ORM / Database Tooling:** Prisma ORM with SQLite
- **Auth & Security:** `jsonwebtoken` (with `jwt.verify`), `bcryptjs` for password hashing, `cors`, `dotenv`
- **Validation:** Zod (for request validation on both client & server)

### **Database & Seeding**
- **Engine:** SQLite (`dev.db` file)
- **Seeding Target:** 50,000+ realistic orders generated via high-speed batch transaction script (`seed.ts`) in ~2-3 seconds.
- **Indexes:**
  - `idx_orders_status` (for status filtering)
  - `idx_orders_created_at` (for date sorting)
  - `idx_orders_total_amount` (for amount sorting)
  - `idx_orders_customer_email` / `idx_orders_customer_name` (for fast search lookups)
  - `idx_idempotency_key` (unique constraint for duplicate prevention)

### **Testing & Verification**
- **R2 Duplicate Proof:** Node script / Vitest test sending concurrent requests with the identical idempotency key to prove exactly 1 order is created.

---

## 3. Mandatory Deliverables Checklist

- [ ] **R1: Fast Orders List (50,000+ rows)**
  - Server-side pagination (limit & offset / page).
  - Search by customer name and email.
  - Filter by order status (`PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`).
  - Sort by date and amount.
  - **Rapid-filter test protection**: `AbortController` / sequence tokens so earlier slow responses never overwrite the latest filter result.
- [ ] **R2: Create Order Form & Duplicate Protection**
  - Form validation on both client and server (Zod).
  - Client sends a unique `Idempotency-Key` (UUIDv4) per order attempt.
  - Server stores and locks the idempotency key in the DB.
  - Duplicate requests within the time window return the original order without creating a second record.
  - Automated proof script (`npm run test:duplicate`) that fires 2 concurrent requests and verifies only 1 record exists.
- [ ] **R3: Code Review Task (Auth Middleware)**
  - Document all flaws in `README.md` (e.g. `jwt.decode` vs `jwt.verify`, plaintext password matching, no authorization check on `DELETE`, token in query param).
  - Implement fixed, secure versions in the backend.
  - Write 2-3 sentences on token storage (e.g. `httpOnly` cookie vs `localStorage` and XSS vs CSRF trade-offs).
- [ ] **Written Documentation**
  - `README.md`: Setup commands (< 5 min), seed command, test command, code review answers, product question answer ("Delete all cancelled orders"), "What I skipped and why".
  - `DECISIONS.md`: 3 engineering trade-offs (including R2 approach) + transparent AI tools disclosure.
- [ ] **Visual Proof**
  - 3 screenshots or a 2-minute video demonstrating R1 (rapid-filter test) and R2 (duplicate prevention proof).
