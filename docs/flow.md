# Data Flow

## 1. Policy Creation Flow (POST /policies)

```
Client ──POST /policies──▶ routes ──▶ controller
                                       │  validate payload shape
                                       ▼
                                   service.createPolicy
                                       │
                          ┌────────────┼─────────────────────┐
                          ▼            ▼                     ▼
                  1. customer      2. duplicate         3. compute
                     exists?          policy no.?          GST + total
                     (repo)           (repo)               (utils/gst)
                          │            │                     │
                          └────┬───────┘◀────────────────────┘
                               ▼
                    4. build double-entry rows:
                       Dr Customer Receivable  total
                       Cr Premium Income       premium
                       Cr GST Payable          gst
                               │
                               ▼
                    5. assert debit === credit (utils/ledger)
                               │
                               ▼
                    repo.createPolicyWithLedger
                               │
                               ▼
                        BEGIN TRANSACTION
                        ├─ INSERT policies
                        ├─ INSERT policy_transactions (type=ISSUE)
                        └─ INSERT ledger_entries × 3
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             re-assert balance       any failure
                    │                     │
                    ▼                     ▼
                 COMMIT               ROLLBACK → throw
```

**Ledger effect (₹10,000 premium, 18% GST):**

| Account | Debit | Credit |
|---|---|---|
| Customer Receivable | 11,800 | 0 |
| Premium Income | 0 | 10,000 |
| GST Payable | 0 | 1,800 |

## 2. Payment Flow (POST /payments)

```
Client ──POST /payments──▶ controller ──▶ service.recordPayment
                                              │
                                    1. policy exists? (repo)
                                    2. amount valid?  (> 0, ≤ outstanding)
                                    3. outstanding = SUM(issue) − SUM(payments)
                                       (repo: policy_transactions)
                                              │
                                              ▼
                                    4. build rows:
                                       Dr Cash/Bank            amount
                                       Cr Customer Receivable  amount
                                              │
                                              ▼
                                    5. assert debit === credit
                                              │
                                              ▼
                                  repo.createPaymentWithLedger
                                              │
                                              ▼
                                       BEGIN TRANSACTION
                                       ├─ INSERT policy_transactions (type=PAYMENT)
                                       ├─ INSERT payments
                                       └─ INSERT ledger_entries × 2
                                              │
                                       COMMIT / ROLLBACK
```

**Ledger effect (payment of ₹5,900):**

| Account | Debit | Credit |
|---|---|---|
| Cash/Bank | 5,900 | 0 |
| Customer Receivable | 0 | 5,900 |

Outstanding after payment = 11,800 − 5,900 = ₹5,900 (always computed, never stored).

## 3. Read Flows (GET endpoints)

```
GET /policies/:id
    policies JOIN customers
    + outstanding computed via SUM over policy_transactions
    → single response object, no duplicated totals

GET /policies/:id/ledger
    policy_transactions JOIN ledger_entries JOIN accounts
    WHERE policy_id = ?
    ORDER BY created_at, id
    → chronological double-entry history (audit trail)

GET /policies/:id/summary
    ledger_entries JOIN accounts
    WHERE policy_id = ?
    GROUP BY account
    SELECT SUM(debit), SUM(credit),
           CASE ... net balance per account
    → derived summary, zero stored totals
```

## 4. Correction/Reversal Flow (insert-only)

```
A wrong payment of ₹5,900 was recorded but should have been ₹590.

INSERT ONLY — never UPDATE the original row:

1. INSERT policy_transactions (type=REVERSAL, reference to original payment)
   INSERT ledger_entries:
     Dr Customer Receivable   5,900   (re-open the receivable)
     Cr Cash/Bank             5,900   (reverse the cash)

2. INSERT policy_transactions (type=PAYMENT, corrected amount)
   INSERT ledger_entries:
     Dr Cash/Bank               590
     Cr Customer Receivable     590
```

Net effect = ₹590 paid, full history preserved, every step still balanced.

## 5. Transaction Boundaries

| Operation | Tables written | Transaction? |
|---|---|---|
| POST /customers | customers | single INSERT (auto-commit fine) |
| POST /policies | policies, policy_transactions, ledger_entries | YES — atomic |
| POST /payments | policy_transactions, payments, ledger_entries | YES — atomic |
| GET endpoints | none | read-only |

Rule: any operation touching **more than one financial table** = explicit transaction.
