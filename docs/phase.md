# Phases

> Rule: work happens phase by phase. After each phase the agent explains
> what was done (files + summary), asks for approval, updates sessionlog.md,
> and hands over a ready-to-paste git commit command. The user runs every
> shell command and every git commit. No phase is skipped or merged.

---

## Phase 0 — Documentation Foundation ✅ (current work)

**Goal:** All docs that govern the project.

**Deliverables:**
- docs/architecture.md, sessionlog.md, phase.md, test.md, restriction.md, flow.md, api.md, schema.md
- docs/assignment/assignment.md
- AGENT.md (root, operating rules)

**Approval gate:** User confirms the docs are correct → Phase 1 begins.

---

## Phase 1 — Project Scaffolding

**Goal:** Runnable empty app + database up in Docker.

**Deliverables:**
- package.json + npm scripts (dev, start, db:init, db:seed, test, test:unit, test:integration)
- .env.example + .gitignore
- docker-compose.yml (MySQL 8.4, mounts db/ into /docker-entrypoint-initdb.d, healthcheck)
- db/schema.sql (6 tables, PK/FK/indexes/timestamps)
- db/seed.sql (accounts + sample customers + sample data)
- src/config/db.js (mysql2/promise pool)
- src/app.js + src/server.js (health route only)

**Commands for user (agent provides, user runs):**
- `docker compose up -d`
- `npm install`
- `npm run db:init` (if schema not auto-loaded)

**Approval gate:** `GET /health` responds and MySQL is reachable.

---

## Phase 2 — Utilities & Error Foundation ✅ (completed 2026-09-06)

**Goal:** Shared building blocks used by all modules.

**Deliverables (done):**
- src/utils/ built: apiError.js, apiResponse.js, asyncHandler.js, logger.js, loggerHelpers.js, rateLimiters.js (kept+adapted from user's pasted folder)
- errors.js, validators.js, gst.js, ledger.js, money.js, env.js, index.js (barrel) added
- cloudinary.js, encryption.js, token.js, !Logger.md deleted; root utils/ folder removed
- All files ESM (`"type": "module"` in package.json) — no CJS rewrite needed
- package.json + .env.example + .gitignore created

**Approval gate (pending):** npm install runs clean; unit tests for utils pass (tests come in Phase 7, but a smoke check of imports happens at install time).

---

## Phase 3 — Customers Module

**Goal:** First vertical slice through all layers.

**Deliverables:**
- repository: insert, findById, findByEmail (duplicate check)
- service: validation (name/email/phone), duplicate email rejection
- controller + route: POST /customers
- unit + integration tests

**Approval gate:** POST /customers works end-to-end; duplicate email → 409.

---

## Phase 4 — Policies + Ledger (Policy Issue)

**Goal:** Policy creation with full double-entry posting.

**Deliverables:**
- repositories: policies, policy_transactions, ledger_entries (insert + read)
- service: duplicate policy number check, customer check, GST calc,
  build 3-line ledger (Dr Receivable / Cr Premium Income / Cr GST Payable),
  balance assertion, transactional insert
- controller + route: POST /policies
- unit tests (GST math, ledger build) + integration tests (DB rows, rollback on failure)

**Approval gate:** Policy creation posts exactly 3 balanced ledger rows atomically.

---

## Phase 5 — Payments + Ledger (Payment)

**Goal:** Payments with outstanding computation and overpayment rejection.

**Deliverables:**
- repositories: payments insert, outstanding query (SUM/GROUP BY from policy_transactions)
- service: validate policy, amount > 0, amount ≤ outstanding,
  build Dr Cash/Cr Receivable rows, reversal rows when needed, transactional insert
- controller + route: POST /payments
- integration tests: valid payment, overpayment → 422, unknown policy → 404, zero/negative → 422

**Approval gate:** Payment updates outstanding correctly; overpayments rejected.

---

## Phase 6 — Read APIs (JOIN / GROUP BY / SUM / CASE)

**Goal:** The three GET endpoints proving SQL skills.

**Deliverables:**
- GET /policies/:id — policy + customer + computed outstanding (JOIN + SUM)
- GET /policies/:id/ledger — policy_transactions JOIN ledger_entries JOIN accounts, chronological
- GET /policies/:id/summary — GROUP BY account + SUM with CASE for debit/credit balances
- integration tests for all three

**Approval gate:** Summary numbers match ledger exactly; no duplicated stored totals.

---

## Phase 7 — Full Test Suite & Edge Cases

**Goal:** Complete coverage of assignment validations.

**Deliverables:**
- unit: GST, ledger balance, validators, errors
- integration: duplicate policy number → 409, invalid customer → 404/422,
  invalid amounts → 422, overpayment → 422, unbalanced ledger → rollback (500),
  transaction failure → rollback (forced error test), insert-only audit trail test
- vitest.config.js tuning (unit vs integration projects)

**Approval gate:** `npm test` green; coverage report reviewed.

---

## Phase 8 — Postman Collection + README + Final Review

**Goal:** Submission-ready package.

**Deliverables:**
- postman/EdgeNRoots_Assignment.postman_collection.json (all 6 endpoints + error examples)
- README.md: setup, DB design, accounting logic, commands, test instructions
- Final self-review against assignment checklist
- Final git commit commands handed to user

**Approval gate:** User reviews; repository ready to submit.
