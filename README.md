# SARH Orders Console

A high-performance, concurrency-resilient full-stack web application designed for e-commerce customer operations teams to manage 50,000+ orders without lag or duplicate entries.

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

Below are the vulnerabilities and flaws identified in the legacy contractor snippet, along with the fixes implemented:

1. **CRITICAL SECURITY: `jwt.decode` used instead of `jwt.verify`**
   - *Problem:* `jwt.decode()` merely decodes base64 JSON payload without verifying the HMAC/RSA cryptographic signature. Any malicious attacker can forge an arbitrary token with `role: "admin"` and bypass authentication completely.
   - *Fix:* Replaced with `jwt.verify(token, JWT_SECRET)`, which enforces signature validity and checks expiration (`exp`).

2. **CRITICAL SECURITY: Server-side Authorization Missing on Destructive Endpoint**
   - *Problem:* The comment stated `// admin check is done in the React AdminOnly component`. Relying on client-side UI checks means any authenticated agent or attacker with `curl` or Postman can send `DELETE /api/orders/:id` and wipe orders (OWASP A01: Broken Access Control).
   - *Fix:* Implemented `requireRole("ADMIN")` middleware directly on the Express route, returning `HTTP 403 Forbidden` if a non-admin attempts deletion.

3. **SECURITY: Plaintext Passwords in Database & Timing Vulnerability**
   - *Problem:* `db.users.findFirst({ where: { email, password: req.body.password } })` compares plain-text passwords directly in the database query.
   - *Fix:* Used salted `bcrypt.hash()` during seeding and `bcrypt.compare()` during login.

4. **INFORMATION DISCLOSURE: Token Accepted from `req.query.token`**
   - *Problem:* Passing JWTs via URL query parameters causes tokens to be permanently logged in browser history, proxy logs (Cloudflare, Nginx), and `Referer` headers when clicking outbound links.
   - *Fix:* Restricted token extraction strictly to the standard `Authorization: Bearer <token>` header.

5. **HARDCODED CREDENTIALS:**
   - *Problem:* `const SECRET = "sarh-secret-2026"` was hardcoded in source code.
   - *Fix:* Moved secrets to environment variables (`process.env.JWT_SECRET`) with `.env.example`.

### Token Storage Reasoning
*In our client implementation, tokens are held in React memory (`useState`) and transmitted via `Authorization: Bearer <token>` headers (with httpOnly cookie support as the production target).*  
**Protection:** Storing tokens in memory protects completely against **Cross-Site Request Forgery (CSRF)** because browsers never attach memory tokens automatically to cross-origin requests.  
**Limitation:** It does not protect against arbitrary **Cross-Site Scripting (XSS)** if malicious third-party scripts execute in the page; in a production multi-tenant app, `httpOnly`, `Secure`, `SameSite=Strict` cookies paired with CSRF tokens provide the best defense-in-depth against XSS token exfiltration.

---

## 4. Section 5: The Product Question

> **Question:** The operations lead asks for a button: *"Delete all cancelled orders."* Before you build it, what do you ask her, and what do you propose instead if she cannot answer?

**What I ask her:**  
*"What specific problem are we trying to solve: is this to unclutter the daily view for agents, free up database disk space, or comply with a legal data retention/GDPR requirement?"*

**What I propose if she cannot answer:**  
*"Instead of permanently destroying financial records and audit trails, I propose adding a default UI toggle to **'Hide Cancelled Orders'** from active view, combined with a **'Trash / 30-Day Archive'** view where cancelled orders can be audited or restored with one click."*

---

## 5. What I Skipped and Why

1. **Senior Memo (`SCALE.md`):**  
   Skipped intentionally because I am applying for the **Junior Full Stack Developer** role (the brief states: *"The 'Senior applicants only' section does not apply to you"*).
2. **Heavy Docker / Container Orchestration:**  
   Skipped because the brief explicitly emphasizes that Docker is not needed (*"What it does not need: Docker, deployment. Everything runs locally from the README in under five minutes"*). SQLite was chosen so the project runs with zero friction on any reviewer's machine.
3. **Heavy Component Libraries (MUI/AntD):**  
   Tailwind CSS was used instead to keep the bundle lightweight, transparent, and completely free of third-party CSS bloat.
4. **Dedicated Full-Page Order Route (`/orders/new`):**  
   Implemented as an in-context slide-over drawer to optimize build time and provide fast phone order entry without losing table context or search/filter state. As noted in `DECISIONS.md`, for complex enterprise B2B company workflows with 20+ line items and documents, a dedicated `/orders/new` page would be preferred, but was scoped down to the drawer given the lightweight phone intake brief.
