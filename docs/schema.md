# Database Schema Design

> Full DDL lives in `db/schema.sql`. This doc explains **what** and **why**.

## 1. ER Overview

```
customers 1 ──── n policies 1 ──── n policy_transactions 1 ──── n ledger_entries n ──── 1 accounts
                                          │
                                          └──── 1 ──── n payments (each payment links to its transaction)
```

- `customers` — who owns the policy.
- `policies` — the contract: premium, GST rate, dates, unique policy number.
- `policy_transactions` — **audit trail** for every financial event (ISSUE, PAYMENT, REVERSAL, CORRECTION). This is the insert-only backbone.
- `payments` — payment-specific data (amount, date, reference). One payment = one transaction row.
- `accounts` — chart of accounts (Customer Receivable, Premium Income, GST Payable, Cash/Bank).
- `ledger_entries` — the actual double-entry lines: debit/credit per account per transaction.

## 2. Table-by-Table Rationale

### customers
| Column | Type | Why |
|---|---|---|
| id | BIGINT PK AUTO_INCREMENT | stable FK target |
| name | VARCHAR(100) NOT NULL | required |
| email | VARCHAR(150) UNIQUE NOT NULL | duplicate-customer validation |
| phone | VARCHAR(20) | optional contact |
| created_at / updated_at | TIMESTAMP | assignment requires timestamps |

### policies
| Column | Type | Why |
|---|---|---|
| id | BIGINT PK | FK target |
| customer_id | FK → customers | invalid-customer check via FK |
| policy_number | VARCHAR(50) UNIQUE | duplicate policy validation (index enforces it at DB level) |
| premium | DECIMAL(14,2) | money — never FLOAT (rounding errors) |
| gst_rate | DECIMAL(5,2) | rate per policy, e.g. 18.00 |
| gst_amount | DECIMAL(14,2) | computed at creation (18% of premium) |
| total_premium | DECIMAL(14,2) | premium + GST — stored once at issue, but **outstanding is never stored** |
| start_date / end_date | DATE | policy term |
| status | VARCHAR(20) | ACTIVE (status changes are new transactions, not UPDATEs) |
| created_at / updated_at | TIMESTAMP | timestamps |

### policy_transactions (the insert-only core)
| Column | Type | Why |
|---|---|---|
| id | BIGINT PK | FK target for ledger + payments |
| policy_id | FK → policies | groups all events of a policy |
| type | ENUM/VARCHAR | ISSUE, PAYMENT, REVERSAL, CORRECTION |
| amount | DECIMAL(14,2) | signed effect on outstanding (+ for issue, − for payment) |
| reference | VARCHAR(50) | links reversals to original transactions |
| created_at | TIMESTAMP | audit timestamp |

### payments
| Column | Type | Why |
|---|---|---|
| id | BIGINT PK | — |
| policy_id | FK → policies | direct lookup |
| transaction_id | FK → policy_transactions | 1:1 link to audit trail |
| amount | DECIMAL(14,2) | payment amount |
| payment_date | DATE | when paid |
| created_at | TIMESTAMP | — |

### accounts
| Column | Type | Why |
|---|---|---|
| id | BIGINT PK | — |
| code | VARCHAR(20) UNIQUE | accounting code (e.g. 1100, 4100) |
| name | VARCHAR(100) UNIQUE | account name |
| type | VARCHAR(20) | ASSET / LIABILITY / INCOME / EXPENSE |

### ledger_entries
| Column | Type | Why |
|---|---|---|
| id | BIGINT PK | — |
| transaction_id | FK → policy_transactions | groups the 2+ lines of one event |
| account_id | FK → accounts | which account |
| debit | DECIMAL(14,2) NOT NULL DEFAULT 0 | debit side |
| credit | DECIMAL(14,2) NOT NULL DEFAULT 0 | credit side |
| created_at | TIMESTAMP | — |

Indexes: FK columns all indexed (MySQL creates them automatically), plus
`(transaction_id)`, `(account_id)`, `(policy_id, created_at)` for ledger reads.

## 3. Key Decisions

1. **DECIMAL, not FLOAT** — money must be exact. DECIMAL(14,2) covers crores with paise.
2. **policy_transactions as audit trail** — even with insert-only, we need a single
   table that answers "what happened to this policy, in order?" That's this table.
3. **payments separate from transactions** — transaction = accounting event;
   payment = business record. The 1:1 FK keeps them glued.
4. **No stored balances anywhere** — outstanding is `SUM(issue) − SUM(payments)`
   computed from policy_transactions; account balances from ledger_entries.
5. **UNIQUE constraints do validation too** — duplicate policy number/email is
   caught by the DB even if app validation is bypassed (409 mapping).
6. **FK enforcement ON** — `RESTRICT` on delete (we never delete anyway) and
   this makes "invalid customer" impossible at the DB level.
7. **Seed data** — `db/seed.sql` inserts the 4 accounts plus sample customers,
   policies, payments, all balanced.
