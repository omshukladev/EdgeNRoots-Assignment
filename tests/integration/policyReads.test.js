import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { query, resetDatabase } from "../helpers/db.js";

const seedFullPolicy = async () => {
  await query(
    "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
    ["Amit Sharma", "amit@example.com", "9876543210"],
  );
  await query(
    `INSERT INTO policies (id, customer_id, policy_number, premium, gst_rate, gst_amount, total_premium, start_date, end_date, status)
     VALUES (1, 1, 'POL-2026-0001', 10000.00, 18.00, 1800.00, 11800.00, '2026-09-01', '2027-08-31', 'ACTIVE')`,
  );
  await query(
    "INSERT INTO policy_transactions (id, policy_id, type, amount) VALUES (1, 1, 'ISSUE', 11800.00)",
  );
  await query(
    "INSERT INTO policy_transactions (id, policy_id, type, amount, reference) VALUES (2, 1, 'PAYMENT', -5900.00, 'PAY-0001')",
  );
  await query("INSERT INTO payments (policy_id, transaction_id, amount, payment_date) VALUES (1, 2, 5900.00, '2026-09-06')");
  await query(
    `INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
     (1, 1, 11800.00, 0.00),
     (1, 3, 0.00, 10000.00),
     (1, 4, 0.00, 1800.00),
     (2, 2, 5900.00, 0.00),
     (2, 1, 0.00, 5900.00)`,
  );
};

describe("GET /policies/:id (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns policy detail with customer and outstanding", async () => {
    await seedFullPolicy();

    const res = await request(app).get("/policies/1");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: 1,
      policy_number: "POL-2026-0001",
      customer: { id: 1, name: "Amit Sharma", email: "amit@example.com" },
      premium: 10000,
      gst_rate: 18,
      gst_amount: 1800,
      total_premium: 11800,
      outstanding: 5900,
    });
  });

  it("returns 404 for unknown policy", async () => {
    const res = await request(app).get("/policies/999");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("POLICY_NOT_FOUND");
  });
});

describe("GET /policies/:id/ledger (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns chronological ledger with balanced totals", async () => {
    await seedFullPolicy();

    const res = await request(app).get("/policies/1/ledger");

    expect(res.status).toBe(200);
    expect(res.body.data.policy_id).toBe(1);
    expect(res.body.data.transactions.length).toBe(2);

    const [issue, payment] = res.body.data.transactions;
    expect(issue.type).toBe("ISSUE");
    expect(issue.entries.length).toBe(3);
    expect(payment.type).toBe("PAYMENT");
    expect(payment.entries.length).toBe(2);

    expect(res.body.data.total_debit).toBe(17700);
    expect(res.body.data.total_credit).toBe(17700);
    expect(res.body.data.balanced).toBe(true);
  });

  it("returns 404 for unknown policy", async () => {
    const res = await request(app).get("/policies/999/ledger");
    expect(res.status).toBe(404);
  });
});

describe("GET /policies/:id/summary (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("returns GROUP BY account balances that match ledger exactly", async () => {
    await seedFullPolicy();

    const res = await request(app).get("/policies/1/summary");

    expect(res.status).toBe(200);
    expect(res.body.data.balanced).toBe(true);
    expect(res.body.data.total_debit).toBe(17700);
    expect(res.body.data.total_credit).toBe(17700);

    const byAccount = Object.fromEntries(
      res.body.data.accounts.map((a) => [a.account, a]),
    );

    expect(byAccount["Cash/Bank"]).toMatchObject({ total_debit: 5900, total_credit: 0 });
    expect(byAccount["Customer Receivable"]).toMatchObject({ total_debit: 11800, total_credit: 5900 });
    expect(byAccount["GST Payable"]).toMatchObject({ total_debit: 0, total_credit: 1800 });
    expect(byAccount["Premium Income"]).toMatchObject({ total_debit: 0, total_credit: 10000 });
  });

  it("returns 404 for unknown policy", async () => {
    const res = await request(app).get("/policies/999/summary");
    expect(res.status).toBe(404);
  });
});
