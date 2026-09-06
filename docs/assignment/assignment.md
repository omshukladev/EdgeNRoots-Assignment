# Assignment Summary & Approach

## What This Assignment Is

A backend internship test: build an **Insurance Policy & Accounting Module**
in 2 days. The company wants to see:

1. **MySQL skills** — relational design, FKs, indexes, JOIN, GROUP BY, SUM, CASE.
2. **Accounting correctness** — double-entry ledger, debit = credit always.
3. **Data consistency** — multi-table writes inside MySQL transactions, no partial data.
4. **Discipline** — insert-only architecture (no UPDATE/DELETE on business data),
   clean layered code, good validation.

## The Required Deliverables

| # | Deliverable | Where |
|---|---|---|
| 1 | 6 MySQL tables with PK/FK/indexes/timestamps | `db/schema.sql` |
| 2 | 6 APIs (3 POST, 3 GET) | `src/routes` + Postman collection |
| 3 | Double-entry ledger, always balanced | `src/services` + `utils/ledger.js` |
| 4 | MySQL transactions with ROLLBACK | `src/repositories` |
| 5 | Insert-only corrections/reversals | `policy_transactions` + service logic |
| 6 | JOIN / GROUP BY / SUM / CASE in real queries | read repositories |
| 7 | Layered code: routes → controllers → services → repositories → db | `src/` |
| 8 | Validation of all failure cases | services + tests |
| 9 | Git repository + schema + seed data + Postman export + README | root, `postman/`, `db/` |

## How We're Building It

### Approach: phased, reviewed, tested

- Work is split into 9 phases (see `docs/phase.md`). Nothing is done in one shot.
- After every phase: explanation of what changed → user approval → session log
  update → git commit command handed to the user.
- Every piece of business logic gets unit or integration tests (Vitest 5.x).
- MySQL runs in Docker (8.4 LTS); raw SQL only, no ORM.

### The three hard problems this assignment tests

**1. Double-entry balancing**
Every financial event produces ledger rows where SUM(debit) === SUM(credit).
We build the rows in a pure function, assert balance **before** touching the DB,
and re-assert **inside** the transaction before COMMIT.

**2. Outstanding amount without stored totals**
Outstanding = SUM(ISSUE) − SUM(PAYMENT/REVERSAL) from `policy_transactions`,
computed live. Never duplicated as a column. This forces the SUM/GROUP BY
skills the assignment wants to see.

**3. Insert-only corrections**
A wrong payment is never UPDATEd. Instead: insert a REVERSAL transaction
(opposite ledger rows) + a corrected PAYMENT transaction. History stays
complete and the ledger stays balanced at every point in time.

### Validation checklist (from the assignment)

| Case | How we handle it |
|---|---|
| Duplicate policy number | UNIQUE index + pre-check → 409 |
| Invalid customer | FK + pre-check → 404 |
| Invalid policy (payment) | lookup → 404 |
| Invalid amounts (≤ 0, non-numeric, > 2dp) | validator → 422 |
| Overpayment | outstanding check → 422 |
| Unbalanced ledger entries | balance assertion → rejected before DB |
| Transaction failure | ROLLBACK → 500, zero partial rows |

### Tech choices and why

- **mysql2/promise** — official-ish driver, prepared statements, promise pools.
- **Raw SQL** — the assignment wants SQL demonstrated; an ORM would hide it.
- **Express 5** — latest major; async handlers auto-forward errors.
- **Vitest 5** — fast, modern, first-class JS support; supertest for HTTP tests.
- **MySQL 8.4 LTS in Docker** — zero-install DB for the reviewer; `docker compose up`
  provisions schema + seed automatically.
- **node --watch** — dev server without nodemon dependency.
