# Backend Intern Assignment
## Insurance Policy & Accounting Module

**Duration:** 2 Days
**Level:** Strong Intern / Junior Backend Developer

## Tech Stack

Node.js, JavaScript, Express.js, MySQL

## Objective

Build a small insurance backend module covering policies, payments and accounting ledger entries. Focus on MySQL, relational data, accounting logic and data consistency.

## 1. Database

Create related MySQL tables: `customers`, `policies`, `policy_transactions`, `payments`, `accounts`, `ledger_entries`. Use primary keys, foreign keys, indexes and timestamps.

## 2. Policy API

**POST /policies**

Create a policy and calculate GST and total premium.

Example: Premium ₹10,000 + GST 18% = ₹1,800 GST, ₹11,800 total.

## 3. Payment API

**POST /payments**

Record a payment and calculate the outstanding amount. Reject invalid policies and payments greater than the outstanding amount.

## 4. Accounting Ledger

Every financial operation must create double-entry ledger records. Debit total must equal credit total.

| Account | Debit | Credit |
|---|---|---|
| Customer Receivable | 11,800 | 0 |
| Premium Income | 0 | 10,000 |
| GST Payable | 0 | 1,800 |

## 5. MySQL Transaction

Multi-table financial operations must use a MySQL transaction. If any step fails, ROLLBACK; otherwise COMMIT. No partial accounting data should remain.

## 6. Insert-Only Architecture — Mandatory

Business and financial records must be INSERT ONLY.

Do NOT use UPDATE or DELETE to modify/correct business data. If a payment is wrong, create a new reversal/correction transaction instead of changing the original record. Maintain the complete transaction history.

## 7. Required APIs

- POST /customers
- POST /policies
- POST /payments
- GET /policies/:id
- GET /policies/:id/ledger
- GET /policies/:id/summary

## 8. SQL Requirements

Demonstrate practical use of JOIN, GROUP BY, SUM, CASE, foreign keys, indexes and transactions. Financial summaries should be calculated from ledger/transaction data rather than duplicated totals.

## 9. JavaScript Structure

Use a clean structure such as: routes → controllers → services → repositories → database. Keep accounting/business logic out of route handlers.

## 10. Validation

Handle duplicate policy numbers, invalid customers/policies, invalid amounts, overpayments, unbalanced ledger entries and transaction failures.

## Submission

1. Git repository
2. MySQL schema + sample data
3. API collection (Postman/Thunder Client)
4. README with setup, database design and accounting logic

## Key Requirements

- MySQL is mandatory.
- Accounting entries must balance.
- Multi-table operations must use transactions.
- Business data follows INSERT-ONLY architecture.
- Corrections/reversals must be new inserted records.
- Complete the assignment within 2 days.