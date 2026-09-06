# Insurance Policy & Accounting Module

A backend module for an insurance company covering **policies, payments, and double-entry accounting** — built as a backend internship assignment.

**Stack:** Node.js 24 LTS · JavaScript (ESM) · Express 5 · MySQL 8.4 (Docker) · Vitest 5

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Database Design](#database-design)
7. [Accounting Logic](#accounting-logic)
8. [API Reference](#api-reference)
9. [Testing](#testing)
10. [Postman Collection](#postman-collection)
11. [Database Commands](#database-commands)
12. [Key Design Decisions](#key-design-decisions)

---

## Features

- **6 relational MySQL tables** with primary keys, foreign keys, indexes, and timestamps
- **Policy creation** with automatic GST calculation and total premium (e.g. ₹10,000 + 18% GST = ₹11,800)
- **Payment recording** with live outstanding computation and overpayment rejection
- **Double-entry accounting** — every financial event posts balanced ledger entries (debit = credit)
- **MySQL transactions** — multi-table writes are atomic: ROLLBACK on any failure, zero partial data
- **Insert-only architecture** — no UPDATE/DELETE on business data; corrections are new reversal records
- **Computed summaries** — outstanding and account balances are always derived from ledger data, never stored
- **Full validation** — duplicates, invalid customers/policies, invalid amounts, overpayments, unbalanced entries, transaction failures
- **83 automated tests** with 97.97% statement coverage, including forced-rollback proofs
- **Postman collection** with real example responses for every endpoint

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 24.x LTS |
| Language | JavaScript (ES Modules) | — |
| Web framework | Express | 5.2.x |
| Database | MySQL (Docker) | 8.4 LTS |
| DB driver | mysql2 | 3.24.x |
| Testing | Vitest + supertest | 5.0.x / 7.2.x |
| Logging | winston + morgan | 3.19.x / 1.12.x |
| Rate limiting | express-rate-limit | 8.7.x |
| Env config | dotenv | 17.4.x |

No ORM — all SQL is hand-written to demonstrate JOIN, GROUP BY, SUM, CASE, foreign keys, indexes, and transactions.

## Project Structure

```
├── src/
│   ├── config/db.js              # mysql2/promise pools (main + test)
│   ├── controllers/              # HTTP handlers (parse → service → respond)
│   ├── routes/                   # Express route definitions only
│   ├── services/                 # Business logic: GST, validation, ledger balancing
│   ├── repositories/             # Raw SQL + explicit transactions
│   ├── utils/                    # Errors, validators, GST/ledger/money helpers, logger
│   ├── app.js                    # Express app assembly (no port binding)
│   └── server.js                 # Entry point
├── db/
│   ├── schema.sql                # DDL: 6 tables, FKs, indexes, timestamps
│   ├── seed.sql                  # Sample data: 5 customers, 6 policies, payments + reversal
│   └── test.sql                  # Test DB accounts
├── scripts/
│   └── db.js                     # migrate / seed / fresh commands
├── tests/
│   ├── unit/                     # Pure logic tests (no DB)
│   ├── integration/              # Full API → MySQL tests
│   ├── helpers/db.js             # Test DB reset helpers
│   └── setup.integration.js      # Test DB routing
├── postman/
│   └── EdgeNRoots_Assignment.postman_collection.json
├── docker-compose.yml            # MySQL 8.4 container
├── vitest.config.js
└── package.json
```

**Layer flow (strict):** `routes → controllers → services → repositories → database`
Business logic lives in services. SQL lives only in repositories. No exceptions.

## Quick Start

**Prerequisites:** Node.js 24+, Docker + Docker Compose, npm

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env

# 3. Start MySQL (first run auto-creates databases + sample data)
docker compose up -d

# 4. (Optional) Reset and reseed both databases
npm run db:fresh

# 5. Start the server (auto-reloads on changes)
npm run dev
```

Verify it's up: `GET http://localhost:3000/health` → `{ "data": { "db": "connected" } }`

## Environment Variables

Copy `.env.example` to `.env`. Defaults match `docker-compose.yml`:

```env
# Server
PORT=3000
NODE_ENV=development

# MySQL (app user — matches docker-compose.yml)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=insurance_user
DB_PASSWORD=insurance_pass
DB_NAME=insurance_db
DB_NAME_TEST=insurance_test

# MySQL admin (used by migrate/seed/fresh scripts)
DB_ROOT_USER=root
DB_ROOT_PASSWORD=rootpass
```

**Database connection details** (for MySQL GUI tools):

| Field | Value |
|---|---|
| Host | `127.0.0.1` |
| Port | `3306` |
| Username | `insurance_user` |
| Password | `insurance_pass` |
| Database | `insurance_db` |
| Connection string | `mysql://insurance_user:insurance_pass@127.0.0.1:3306/insurance_db` |

## Database Design

Six tables with foreign keys, indexes, and timestamps:

| Table | Purpose |
|---|---|
| `customers` | Policy holders (unique email) |
| `policies` | Insurance contracts — premium, GST rate/amount, total, dates (unique policy number) |
| `policy_transactions` | **Audit trail** — every financial event (ISSUE, PAYMENT, REVERSAL) with signed amount |
| `payments` | Payment records, 1:1 linked to a PAYMENT transaction |
| `accounts` | Chart of accounts: Customer Receivable, Cash/Bank, Premium Income, GST Payable |
| `ledger_entries` | Double-entry lines: debit/credit per account per transaction |

**Key decisions:**
- Money is `DECIMAL(14,2)` — never FLOAT (precision)
- `policy_transactions` is the single source of truth for outstanding: `SUM(ISSUE) − SUM(PAYMENTS)`
- Account balances are never stored — always derived via `GROUP BY + SUM` from `ledger_entries`
- UNIQUE constraints on `policy_number` and `email` enforce duplicates at the DB level
- Foreign keys are enforced (`RESTRICT`) — an invalid customer is impossible at the DB level

## Accounting Logic

### Policy issue (₹10,000 premium, 18% GST)

| Account | Debit | Credit |
|---|---|---|
| Customer Receivable | 11,800 | 0 |
| Premium Income | 0 | 10,000 |
| GST Payable | 0 | 1,800 |

### Payment (₹5,900)

| Account | Debit | Credit |
|---|---|---|
| Cash/Bank | 5,900 | 0 |
| Customer Receivable | 0 | 5,900 |

**Balancing is enforced twice:** once in the service layer (before touching the DB) and again inside the MySQL transaction — debit total must equal credit total, always.

### Insert-only corrections

A wrong payment is never UPDATEd. Instead, two new transactions are inserted:

1. **REVERSAL** — opposite ledger rows, re-opens the receivable
2. **CORRECTED PAYMENT** — the right amount

The sample data contains a live example (policy `POL-2026-0002`: ₹15,000 payment reversed and corrected to ₹12,500). Full history is always preserved.

### Outstanding amount

```sql
SUM(CASE WHEN type = 'ISSUE' THEN amount ELSE 0 END) -
SUM(CASE WHEN type IN ('PAYMENT', 'REVERSAL') THEN -amount ELSE 0 END)
```

Computed live from `policy_transactions` — never duplicated as a stored column.

## API Reference

Base URL: `http://localhost:3000`

### POST /customers

```json
{ "name": "Amit Sharma", "email": "amit@example.com", "phone": "9876543210" }
```
→ `201` customer object · `409` duplicate email · `422` invalid name/email/phone

### POST /policies

```json
{
  "customer_id": 1,
  "policy_number": "POL-2026-0007",
  "premium": 10000,
  "gst_rate": 18,
  "start_date": "2026-09-01",
  "end_date": "2027-08-31"
}
```
→ `201` policy + GST/total + 3 balanced ledger entries · `409` duplicate policy number · `404` unknown customer · `422` invalid premium/rate/dates

### POST /payments

```json
{ "policy_id": 1, "amount": 5900, "payment_date": "2026-09-06" }
```
→ `201` payment + new outstanding + 2 balanced ledger entries · `422` overpayment or invalid amount · `404` unknown policy

### GET /policies/:id
Policy + customer + computed outstanding.

### GET /policies/:id/ledger
Chronological audit trail: every transaction with its balanced entries, totals, and `balanced` flag.

### GET /policies/:id/summary
Per-account balances derived with GROUP BY + SUM + CASE, plus totals and `balanced` flag.

**Error envelope (all errors):**
```json
{ "status": 409, "code": "DUPLICATE_EMAIL", "message": "...", "errors": [], "success": false }
```

## Testing

```bash
npm test                # all tests (unit + integration)
npm run test:unit       # unit only — no DB needed
npm run test:integration # integration — requires MySQL up
npm run test:coverage   # full run + coverage report (HTML in coverage/)
```

**83 tests — all green:**
- **55 unit tests** — GST math, ledger balancing, validators, error envelopes, services with mocked repositories
- **28 integration tests** — real MySQL round-trips verifying actual DB rows, not just status codes
- **Rollback proofs** — forced mid-transaction failures assert zero partial rows survive
- **Coverage:** 97.97% statements / 86.24% branches / 98.61% functions

Integration tests use a dedicated `insurance_test` database, truncated and reseeded per test file.

## Postman Collection

Import `postman/EdgeNRoots_Assignment.postman_collection.json` — all 15 requests with real example responses:

- Health: `GET /health`
- Customers: valid / duplicate / invalid (3)
- Policies: valid / duplicate / unknown customer + detail / ledger / summary / 404 (7)
- Payments: valid / overpayment / unknown policy / negative amount (4)

## Database Commands

| Command | What it does |
|---|---|
| `npm run db:migrate` | Create DBs if missing + apply schema to both DBs (idempotent) |
| `npm run db:seed` | Reset `insurance_db` and load sample data |
| `npm run db:fresh` | Reset both DBs — main gets schema+seed, test gets schema+accounts |
| `docker compose up -d` | Start MySQL (auto-provisions on fresh volume) |
| `docker compose down` | Stop MySQL (data kept) |
| `docker compose down -v` | Stop MySQL and delete all data |

## Key Design Decisions

1. **Raw SQL, no ORM** — the assignment tests SQL ability; every JOIN, GROUP BY, SUM, and CASE is hand-written
2. **Insert-only architecture** — business data is never updated or deleted; corrections are new reversal records
3. **Explicit transactions** — `BEGIN → inserts → COMMIT`, with `ROLLBACK` on any failure and connection release in `finally`
4. **Balance before DB** — the service asserts debit = credit *before* any write, and the transaction re-checks inside
5. **No stored totals** — outstanding and account balances are always computed from ledger/transaction data
6. **DECIMAL money** — `DECIMAL(14,2)` everywhere, rounded to 2dp in a pure helper, `decimalNumbers: true` in the pool
7. **Layered by discipline** — controllers have no SQL or business math; repositories have no business rules
8. **Tested rollback** — not just claimed; integration tests force mid-transaction failures and assert zero partial rows
