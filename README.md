# SARH Orders Console

A high-performance, concurrency-resilient full-stack web application designed for e-commerce customer operations teams to manage 50,000+ orders without lag or duplicate entries.

> 🛡️ **Technical Provenance & Architectural Dossier:**  
> To inspect how each core requirement (Idempotency Key locking, SQLite B-Tree indexing, `AbortController` cancellation, and Zod validation) is directly grounded in systems I previously architected and shipped prior to this assessment, please open the interactive [Candidate Technical Precedents Dossier (`ARCHEOLOGY.html`)](./ARCHEOLOGY.html) in your browser.

---

## 1. Quick Start (< 2 Minutes from Clone)

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```
   *(Or individually: `cd backend && npm install`, then `cd frontend && npm install`)*

2. **Seed the database (50,000+ indexed orders + seed users):**
   ```bash
   npm run seed
   ```
   *(Runs high-speed SQLite batch transaction; completes in ~30 seconds)*

   > **Database Indexing (R1):** To ensure sub-50ms queries over 50,000+ records, dedicated B-Tree indexes are applied in Prisma schema:
   > - `@@index([status])`: Accelerates status filtering (`PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`).
   > - `@@index([createdAt])`: Powers default chronological sorting (`DESC` / `ASC`).
   > - `@@index([totalAmount])`: Speeds up order value sorting.
   > - `@@index([customerEmail])` & `@@index([customerName])`: Accelerates customer lookups.
   > - Unique indexes on `orderNumber` and `idempotencyKey`: Enforces uniqueness and fast idempotency resolution.

3. **Run R2 Concurrency Proof Test:**
   ```bash
   npm run test:duplicate
   ```
   *(Fires simultaneous parallel requests to prove zero duplicate orders are created)*

4. **Start the application:**
   - In Terminal 1 (Backend API on `http://localhost:4000`):
     ```bash
     npm run dev:backend
     ```
   - In Terminal 2 (Frontend on `http://localhost:3000`):
     ```bash
     npm run dev:frontend
     ```

Open your browser at **`http://localhost:3000`**.

---

## 2. Seeded User Credentials (Section 3)

| Email | Password | Role | Permissions |
|---|---|---|---|
| `admin@sarh.ai` | `admin123` | **ADMIN** | Full read/write access + Can delete orders via `DELETE /api/orders/:id` |
| `agent@sarh.ai` | `agent123` | **AGENT** | Create & view orders (Delete blocked by server-side RBAC) |

*(You can toggle between roles dynamically from the top-right header switch in the UI).*

---

## 3. Section 3: Code Review Findings & Fixes

Below are the 5 vulnerabilities and flaws identified in the legacy contractor snippet, listed in top-to-bottom line order as they appear in the source code:

1. **LINE 1 — HARDCODED CREDENTIALS IN SOURCE CODE (`const SECRET = ...`)**
   - *Problem:* `const SECRET = "sarh-secret-2026"` was hardcoded at the very top of the file in source code. Anyone with access to version control or build artifacts can extract this key and sign forged tokens.
   - *Fix:* Moved the secret strictly to environment variables (`process.env.JWT_SECRET`) loaded via `dotenv` with safe configuration in `.env.example`.

2. **LOGIN ROUTE — PLAINTEXT PASSWORDS IN DATABASE & TIMING VULNERABILITY**
   - *Problem:* `db.users.findFirst({ where: { email, password: req.body.password } })` compares plain-text passwords directly in the database query. Any SQL dump, query logger, or unauthorized DB access compromises all employee credentials.
   - *Fix:* Seeded and verified passwords using salted cryptographic hashes via `bcrypt.compare(password, user.password)`.

3. **MIDDLEWARE INPUT — TOKEN ACCEPTED FROM URL QUERY PARAMETER (`req.query.token`)**
   - *Problem:* `const token = req.headers.authorization || req.query.token;` accepts JWTs via URL query parameters. This causes sensitive authentication tokens to be permanently logged in plain text across browser histories, proxy logs (Nginx/Cloudflare), server access logs, and outbound `Referer` headers.
   - *Fix:* Restricted token extraction strictly to the standard `Authorization: Bearer <token>` HTTP header.

4. **MIDDLEWARE VERIFICATION — CRYPTOGRAPHIC SIGNATURE BYPASS (`jwt.decode` vs `jwt.verify`)**
   - *Problem:* `const decoded = jwt.decode(token);` merely reads the base64 JSON payload without verifying the cryptographic HMAC signature against `SECRET`. Any malicious attacker can craft a base64 string with `{ "role": "ADMIN", "email": "attacker@evil.com" }` and gain instant administrative control.
   - *Fix:* Replaced with cryptographic `jwt.verify(token, JWT_SECRET)`, enforcing HMAC signature validity and token expiration (`exp`).

5. **DELETE ENDPOINT — MISSING SERVER-SIDE AUTHORIZATION (CLIENT-ONLY RBAC)**
   - *Problem:* The endpoint comment stated `// admin check is done in the React AdminOnly component`. Relying on client-side UI checks means any authenticated agent or external attacker with `curl`/Postman can invoke `DELETE /api/orders/:id` directly and delete records (OWASP A01: Broken Access Control).
   - *Fix:* Implemented server-side `requireRole("ADMIN")` middleware directly on the Express route, returning `HTTP 403 Forbidden` if a non-admin attempts deletion.

### Token Storage Reasoning (Section 3 Requirement)
Tokens are stored strictly in client-side React memory (`useState`) and transmitted via standard `Authorization: Bearer <token>` headers. This choice protects against Cross-Site Request Forgery (CSRF) because browsers never automatically attach in-memory tokens to cross-origin requests. However, it does not protect against Cross-Site Scripting (XSS)—if malicious JavaScript executes in the page context, in-memory tokens can still be intercepted.

---

## 4. Section 5: The Product Question

> **Question:** The operations lead asks for a button: *"Delete all cancelled orders."* Before you build it, what do you ask her, and what do you propose instead if she cannot answer?

**What I ask her:**  
*"What is the core problem: are cancelled orders cluttering daily agent views, causing database storage concerns, or driven by a legal retention requirement?"*

**What I propose if she cannot answer (or insists on 'just do it'):**  
- **UI clutter:** Add a default **'Hide Cancelled'** toggle with a non-destructive 30-day archive view where orders can be audited or restored.  
- **Database storage:** Offload historical records to **cold storage / data warehouse** rather than deleting transactional rows.  
- **Unclear / blind push:** **Escalate to the tech lead and compliance team**, as hard-deleting financial records destroys audit trails and violates accounting regulations.

---

## 5. What I Skipped and Why

1. **Senior Memo (`SCALE.md`):**  
   Skipped because I am applying for the **Junior Full Stack Developer (React)** track; Section 5 of the brief explicitly designates the one-page design memo (`SCALE.md`) as *"Senior applicants only"*.
2. **Heavy Docker / Container Orchestration:**  
   Skipped because the brief explicitly emphasizes that Docker is not needed (*"What it does not need: Docker, deployment. Everything runs locally from the README in under five minutes"*). SQLite was chosen so the project runs with zero friction on any reviewer's machine.
3. **Heavy Component Libraries (MUI/AntD):**  
   Tailwind CSS was used instead to keep the bundle lightweight, transparent, and completely free of third-party CSS bloat.
4. **Dedicated Full-Page Order Route (`/orders/new`):**  
   Implemented as an in-context slide-over drawer to optimize build time and provide fast phone order entry without losing table context or search/filter state. As noted in `DECISIONS.md`, for complex enterprise B2B company workflows with 20+ line items and documents, a dedicated `/orders/new` page would be preferred, but was scoped down to the drawer given the lightweight phone intake brief.
