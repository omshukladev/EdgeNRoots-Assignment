# Testing Strategy

> Stack: Vitest 4.x + supertest. Two layers: unit (pure logic, no DB) and
> integration (full HTTP → MySQL round-trips). The assignment does not ask
> for tests — we add them anyway to prove correctness.

## 1. Test Layers

### Unit tests (`tests/unit/`) — no database
| Target | What we prove |
|---|---|
| `utils/gst.js` | ₹10,000 @ 18% → ₹1,800 GST, ₹11,800 total; rounding to 2dp; invalid rates rejected (0, negative, > 100) |
| `utils/ledger.js` | Debit total === credit total assertion passes for balanced rows and throws for unbalanced rows |
| `utils/validators.js` | Amount rules (must be > 0, 2dp max, finite), email format, policy number format, payload shape |
| `utils/money.js` | "₹10,000" / "10,000" / "10000.00" all normalize to 10000.00; garbage input rejected |
| `utils/apiError.js` + `utils/errors.js` | ApiError + domain error classes carry right statusCode/code/message; envelope has success:false |
| `utils/apiResponse.js` | Envelope `{ statusCode, data, message, success }`; `sendSuccess` writes correct status + JSON |
| `utils/asyncHandler.js` | Rejected promises forwarded to next(err); resolved values pass through |
| `utils/env.js` | Missing/invalid env vars throw at startup with clear messages |
| `utils/rateLimiters.js` | globalLimiter exposes standard headers, applies to all routes |
| `services/*` (with mocked repositories) | Policy service rejects duplicate policy numbers and unknown customers; payment service rejects overpayments, zero and negative amounts |

### Integration tests (`tests/integration/`) — real MySQL
| Endpoint / scenario | Expected result |
|---|---|
| `POST /customers` (valid) | 201, customer row inserted |
| `POST /customers` (duplicate email) | 409 ConflictError |
| `POST /policies` (valid) | 201; policy + policy_transaction + exactly 3 ledger rows; debit sum === credit sum |
| `POST /policies` (duplicate policy number) | 409 |
| `POST /policies` (unknown customer) | 404 or 422 |
| `POST /policies` (premium ≤ 0) | 422 |
| `POST /payments` (valid partial) | 201; outstanding reduced by exactly the amount |
| `POST /payments` (amount > outstanding) | 422 overpayment |
| `POST /payments` (unknown policy) | 404 |
| `POST /payments` (amount ≤ 0) | 422 |
| `GET /policies/:id` | 200, includes computed outstanding |
| `GET /policies/:id/ledger` | 200, chronological ledger rows, balanced |
| `GET /policies/:id/summary` | 200, GROUP BY + SUM + CASE summary matches ledger exactly |
| Forced DB failure mid-transaction (inject error) | 500 + ROLLBACK: no partial policy_transactions/payments/ledger rows remain |
| Unbalanced ledger attempt | rejected before DB write |

## 2. Test Database Strategy

- A dedicated MySQL database (`insurance_test`) — same schema, separate data.
- Before each integration suite: TRUNCATE business tables + reseed accounts.
- Every financial test asserts **both** the API response **and** the actual
  DB rows (counts + sums), so tests prove atomicity, not just status codes.

## 3. npm Scripts

```json
{
  "test": "vitest run",
  "test:unit": "vitest run tests/unit",
  "test:integration": "vitest run tests/integration",
  "test:coverage": "vitest run --coverage"
}
```

## 4. Coverage Targets

- utils: 100% (pure functions)
- services: ≥ 90% (core business rules)
- repositories: covered via integration tests (real SQL, real transactions)

## 5. What We Deliberately Test Around (assignment's Validation section)

- Duplicate policy numbers → 409
- Invalid customers/policies → 404/422
- Invalid amounts → 422
- Overpayments → 422
- Unbalanced ledger entries → rejected/500 with rollback
- Transaction failures → rollback, zero partial rows
