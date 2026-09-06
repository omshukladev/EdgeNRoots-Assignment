# Architecture

## 1. Tech Stack (latest stable as of 2026-09-06)

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | 24.x LTS | Long-term support line |
| Language | JavaScript (ES Modules) | ES2023+ | `"type": "module"` in package.json — ESM everywhere |
| Web framework | Express.js | 5.2.x | Latest major, async error handling built-in |
| DB driver | mysql2 | 3.24.x | Promise-based pool, prepared statements |
| Database | MySQL | 8.4 LTS (Docker) | Official `mysql:8.4` image |
| Testing | Vitest | 5.0.x | Unit + integration (5.0 went stable 2026-09-06) |
| HTTP testing | supertest | 7.2.x | For integration tests |
| Dev server | node --watch | Node 24 built-in | No nodemon needed |
| Env config | dotenv | 17.4.x | .env management |
| Logging | winston + morgan | 3.19.x + 1.12.x | App logs + HTTP request logs |
| Rate limiting | express-rate-limit | 8.7.x | Global API limiter |
| API collection | Postman JSON export | v2.1 format | Submission requirement |

## 2. Folder Structure

```
EdgeNRoots-Assignment/
├── AGENT.md                  # Agent operating rules (read first)
├── docs/
│   ├── architecture.md       # This file
│   ├── sessionlog.md         # Time-stamped work log (updated after every edit)
│   ├── phase.md              # Task divided into approval-gated phases
│   ├── test.md               # Testing strategy
│   ├── restriction.md        # Hard rules (latest tech, no self-installs, etc.)
│   ├── flow.md               # Data flows (policy, payment, ledger)
│   ├── api.md                # API contract (endpoints, payloads, errors)
│   ├── schema.md             # DB design rationale
│   ├── cmd.md                # All commands with explanations
│   └── assignment/
│       └── assignment.md     # Assignment summary & approach
├── src/
│   ├── config/
│   │   └── db.js             # mysql2/promise connection pool
│   ├── controllers/          # HTTP handlers: parse request, call service, send response
│   ├── routes/               # Express route definitions only
│   ├── services/             # Business logic: GST math, validation, ledger balancing
│   ├── repositories/         # Raw SQL + explicit transaction handling
│   ├── utils/                # Shared helpers (see utils file inventory below)
│   ├── app.js                # Express app assembly (no port binding)
│   └── server.js             # Entry point: starts server on PORT
├── db/
│   ├── schema.sql            # DDL: 6 tables, FKs, indexes, timestamps
│   ├── seed.sql              # Sample accounts + sample customers/policies/payments
│   └── test.sql              # insurance_test DB (integration tests)
├── tests/
│   ├── unit/                 # Pure logic tests (no DB)
│   └── integration/          # Full API → DB tests (supertest + real MySQL)
├── postman/
│   └── EdgeNRoots_Assignment.postman_collection.json
├── docker-compose.yml        # MySQL 8.4 container, auto-runs schema + seed
├── vitest.config.js
├── package.json
├── .env.example              # Template for .env (DB creds, port)
└── README.md                 # Setup, DB design, accounting logic
```

## 3. Layered Flow (routes → controllers → services → repositories → db)

```
HTTP Request
    │
    ▼
routes/           ── URL + method → controller. No logic here.
    │
    ▼
controllers/      ── Extract/validate input shape, call service,
    │                map result → HTTP status code + JSON. No SQL, no business math.
    ▼
services/         ── Business rules live here:
    │                GST calculation, outstanding computation,
    │                overpayment rejection, double-entry construction,
    │                debit = credit assertion.
    ▼
repositories/     ── Raw SQL only. Own every query string.
    │                Own BEGIN/COMMIT/ROLLBACK lifecycle.
    ▼
config/db.js      ── mysql2/promise pool, connections, transactions.
    │
    ▼
MySQL 8.4 (Docker)
```

### Dependency rule (strict, one-directional)

```
routes → controllers → services → repositories → db
   │           │            │             │
   └───────────┴────────────┴────────────┴──► utils/ may be imported by any layer
```

- Routes never call repositories or services that mutate state directly.
- Controllers never contain SQL or accounting math.
- Services never touch `req`/`res` or SQL strings.
- Repositories never decide business rules — they execute what services ask.

## 3a. utils/ File Inventory (audited 2026-09-06)

The user pasted an existing `utils/` folder from another project (Chatty). We audited
every file and decided what stays, what gets rewritten, and what is deleted.

### ✅ KEEP (adapted — ESM, since Node 24 + Express 5 are ESM-first; no CJS rewrite)

| File | Decision | What changed |
|---|---|---|
| apiError.js | Keep | Named + default export; normalized shape `{ statusCode, code, message, errors, success }`; drop unused stack param |
| apiResponse.js | Keep | Envelope `{ statusCode, data, message, success }`; added `sendSuccess(res, data, message, statusCode)` helper; success = `statusCode < 400` |
| asyncHandler.js | Keep | Named + default export; wraps async controllers, forwards rejections to next(err) |
| logger.js | Keep (adapted) | winston; logs to `logs/` dir (auto-created, gitignored); added `logger.morganStream` for morgan; removed `logExamples` noise |
| loggerHelpers.js | Keep (adapted) | `requestLogger` middleware + `logError(err, req)`; `logExamples` deleted |
| rateLimiters.js | Keep (trimmed) | `loginLimiter`/`signupLimiter` deleted (no auth in this project); `globalLimiter` only, tuned for accounting API |

### ❌ DELETE (not needed for this assignment)

| File | Why delete |
|---|---|
| cloudinary.js | File uploads — this project has no image/media handling |
| encryption.js | No secrets to encrypt; payment/customer data is not encrypted at rest in this assignment |
| token.js | JWT/refresh tokens — no authentication in the required APIs |
| !Logger.md | Learning note from the previous project — not part of the codebase |

### 🆕 ADD (this project's own utilities)

| File | Purpose |
|---|---|
| errors.js | Domain errors: NotFoundError(404), ConflictError(409), ValidationError(422) |
| validators.js | Amount (> 0, ≤ 2dp), email, phone, policy number, dates, payload shape |
| gst.js | Premium + rate → gst amount, total premium, 2dp rounding, rate validation |
| ledger.js | Build double-entry rows + assert SUM(debit) === SUM(credit) |
| money.js | Normalize ₹ string input ("10,000" / "₹10,000") → decimal number |
| env.js | Read + validate env vars at startup (fail fast with clear message) |
| index.js | Barrel file: re-export everything so imports are one line |

### Final utils/ tree (src/utils/, 13 files)

```
src/utils/
├── index.js          # barrel: one import line for all utils
├── apiError.js       # ApiError class (kept, adapted)
├── apiResponse.js    # ApiResponse + sendSuccess helper (kept, adapted)
├── asyncHandler.js   # async route wrapper (kept)
├── errors.js         # domain error classes (new)
├── validators.js     # input validation rules (new)
├── gst.js            # GST calculator (new)
├── ledger.js         # double-entry builder + balance assertion (new)
├── money.js          # money parsing/normalization (new)
├── env.js            # env validation (new)
├── logger.js         # winston logger (kept, adapted)
├── loggerHelpers.js  # requestLogger + logError (kept, adapted)
└── rateLimiters.js   # globalLimiter only (kept, trimmed)
```

## 4. Request Lifecycle (example: POST /payments)

1. `routes/payment.routes.js` → `POST /payments` → `paymentController.createPayment`.
2. Controller validates payload shape (has `policy_id`, `amount`; types correct).
3. Controller calls `paymentService.recordPayment({ policyId, amount, ... })`.
4. Service:
   - Loads policy + computed outstanding via repository.
   - Rejects: unknown policy, amount ≤ 0, amount > outstanding.
   - Builds double-entry rows: Dr Customer Receivable, Cr Cash/Bank, Cr GST Receivable (reversal portion).
   - Asserts `SUM(debit) === SUM(credit)` before touching DB.
5. Service calls repository with an explicit transaction:
   - `BEGIN`
   - INSERT `policy_transactions` (PAYMENT row)
   - INSERT `payments`
   - INSERT `ledger_entries` (2–4 rows)
   - Re-assert balance inside the transaction; `ROLLBACK` on any failure, else `COMMIT`.
6. Controller returns `201` with payment + new outstanding, or mapped error (`404`, `409`, `422`, `500`).

## 5. Accounting Model (double-entry)

Every financial event = one `policy_transactions` row + N `ledger_entries` rows.

| Event | Ledger effect |
|---|---|
| Policy issued (₹10,000 + 18%) | Dr Customer Receivable 11,800 / Cr Premium Income 10,000 / Cr GST Payable 1,800 |
| Payment of ₹5,900 | Dr Cash/Bank 5,900 / Cr Customer Receivable 5,900 |
| GST portion reversal on payment (if applicable) | Dr GST Payable / Cr GST Receivable |

- Debits must equal credits — enforced in service AND re-checked inside the MySQL transaction.
- Account balances are never stored as columns. Everything is derived with SUM/GROUP BY/CASE from `ledger_entries`.

## 6. Insert-Only Architecture

- `INSERT` only for business/financial tables.
- No `UPDATE`/`DELETE` anywhere in repositories for business data.
- Corrections = new rows: a `REVERSAL` or `CORRECTION` `policy_transactions` row + opposite-side ledger entries.
- Full history preserved: `policy_transactions` is the audit trail.
- The only writes that are not INSERTs: `BEGIN`, `COMMIT`, `ROLLBACK`, and test cleanup (test DB truncation).

## 7. Transaction Pattern (repository-level)

```js
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  // 1. INSERT policy_transactions
  // 2. INSERT payments
  // 3. INSERT ledger_entries
  // 4. Assert debit total === credit total (from the rows just built)
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err; // no partial data survives
} finally {
  conn.release();
}
```

## 8. Error Handling & Response Envelope

- `src/utils/apiError.js` — `ApiError` class (kept from user's existing utils, adapted):
  carries `statusCode`, `message`, `errors`, `success: false`.
- `src/utils/apiResponse.js` — `ApiResponse` envelope (kept, adapted):
  `{ statusCode, data, message, success }` + `sendSuccess(res, data, message, statusCode)` helper.
- `src/utils/errors.js` — domain errors: `NotFoundError(404)`, `ConflictError(409)`, `ValidationError(422)`.
- Every controller returns via `ApiResponse`/`sendSuccess` — **systematic responses everywhere, zero ad-hoc `res.json`**.
- `src/utils/asyncHandler.js` — wraps async controllers so rejected promises reach the error middleware (explicit even though Express 5 does it automatically).
- One central Express error middleware maps `ApiError`/domain errors → `{ status, code, message, errors }`.
- `src/utils/loggerHelpers.js` — `requestLogger` middleware + `logError(err, req)` called by the global error handler, so every error is persisted by winston.
