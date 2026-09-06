# API Contract

Base URL: `http://localhost:3000` (configurable via PORT env)
Format: JSON everywhere. Error envelope: `{ "status": <code>, "code": "<CODE>", "message": "<human text>" }`

## 1. POST /customers

Create a customer.

**Request**
```json
{
  "name": "Amit Sharma",
  "email": "amit@example.com",
  "phone": "9876543210"
}
```

**201 Created**
```json
{
  "id": 1,
  "name": "Amit Sharma",
  "email": "amit@example.com",
  "phone": "9876543210",
  "created_at": "2026-09-06T12:00:00.000Z"
}
```

**Errors:** 409 duplicate email · 422 invalid name/email/phone

## 2. POST /policies

Create a policy + post double-entry ledger.

**Request**
```json
{
  "customer_id": 1,
  "policy_number": "POL-2026-0001",
  "premium": 10000,
  "gst_rate": 18,
  "start_date": "2026-09-01",
  "end_date": "2027-08-31"
}
```

**201 Created**
```json
{
  "policy": { "id": 1, "policy_number": "POL-2026-0001", "premium": 10000, "gst_rate": 18, "gst_amount": 1800, "total_premium": 11800, "status": "ACTIVE" },
  "ledger_entries": [
    { "account": "Customer Receivable", "debit": 11800, "credit": 0 },
    { "account": "Premium Income",     "debit": 0,     "credit": 10000 },
    { "account": "GST Payable",        "debit": 0,     "credit": 1800 }
  ]
}
```

**Errors:** 409 duplicate policy number · 404 unknown customer · 422 premium ≤ 0 / bad gst_rate / bad dates

## 3. POST /payments

Record a payment; computes outstanding first.

**Request**
```json
{
  "policy_id": 1,
  "amount": 5900,
  "payment_date": "2026-09-06"
}
```

**201 Created**
```json
{
  "payment": { "id": 1, "policy_id": 1, "amount": 5900, "payment_date": "2026-09-06" },
  "outstanding_after_payment": 5900,
  "ledger_entries": [
    { "account": "Cash/Bank",           "debit": 5900, "credit": 0 },
    { "account": "Customer Receivable", "debit": 0,    "credit": 5900 }
  ]
}
```

**Errors:** 404 unknown policy · 422 amount ≤ 0 · 422 overpayment (amount > outstanding)

## 4. GET /policies/:id

Policy + customer + computed outstanding.

```json
{
  "id": 1,
  "policy_number": "POL-2026-0001",
  "customer": { "id": 1, "name": "Amit Sharma", "email": "amit@example.com" },
  "premium": 10000, "gst_rate": 18, "gst_amount": 1800, "total_premium": 11800,
  "outstanding": 5900,
  "created_at": "2026-09-06T12:00:00.000Z"
}
```

**Errors:** 404 policy not found

## 5. GET /policies/:id/ledger

Chronological double-entry history.

```json
{
  "policy_id": 1,
  "transactions": [
    {
      "transaction_id": 1,
      "type": "ISSUE",
      "reference": null,
      "created_at": "2026-09-06T12:00:00.000Z",
      "entries": [
        { "account": "Customer Receivable", "debit": 11800, "credit": 0 },
        { "account": "Premium Income",     "debit": 0,     "credit": 10000 },
        { "account": "GST Payable",        "debit": 0,     "credit": 1800 }
      ]
    },
    {
      "transaction_id": 2,
      "type": "PAYMENT",
      "reference": "PAY-0001",
      "created_at": "2026-09-06T13:00:00.000Z",
      "entries": [
        { "account": "Cash/Bank",           "debit": 5900, "credit": 0 },
        { "account": "Customer Receivable", "debit": 0,    "credit": 5900 }
      ]
    }
  ],
  "total_debit": 17700,
  "total_credit": 17700
}
```

**Errors:** 404 policy not found

## 6. GET /policies/:id/summary

Derived account balances (GROUP BY + SUM + CASE).

```json
{
  "policy_id": 1,
  "accounts": [
    { "account": "Cash/Bank",           "total_debit": 5900,  "total_credit": 0,     "net": "Debit 5900" },
    { "account": "Customer Receivable", "total_debit": 11800, "total_credit": 5900,  "net": "Debit 5900" },
    { "account": "Premium Income",      "total_debit": 0,     "total_credit": 10000, "net": "Credit 10000" },
    { "account": "GST Payable",         "total_debit": 0,     "total_credit": 1800,  "net": "Credit 1800" }
  ],
  "total_debit": 17700,
  "total_credit": 17700,
  "balanced": true
}
```

**Errors:** 404 policy not found

## 7. Error Codes

| HTTP | code | scenario |
|---|---|---|
| 404 | NOT_FOUND | policy/customer missing |
| 409 | DUPLICATE_EMAIL / DUPLICATE_POLICY_NUMBER | uniqueness violation |
| 422 | VALIDATION_ERROR / OVERPAYMENT / INVALID_AMOUNT | bad input or business rule |
| 500 | TRANSACTION_FAILED | DB failure, rolled back |
