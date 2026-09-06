import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { query, resetDatabase } from "../helpers/db.js";

const seedPolicy = async () => {
  await query(
    "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
    ["Amit Sharma", "amit@example.com", "9876543210"],
  );
  await query(
    `INSERT INTO policies (customer_id, policy_number, premium, gst_rate, gst_amount, total_premium, start_date, end_date, status)
     VALUES (1, 'POL-2026-0002', 10000.00, 18.00, 1800.00, 11800.00, '2026-09-01', '2027-08-31', 'ACTIVE')`,
  );
  await query(
    "INSERT INTO policy_transactions (policy_id, type, amount) VALUES (1, 'ISSUE', 11800.00)",
  );
};

describe("POST /payments (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("records a payment and reduces outstanding", async () => {
    await seedPolicy();

    const res = await request(app).post("/payments").send({
      policy_id: 1,
      amount: 5900,
      payment_date: "2026-09-06",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.outstanding_after_payment).toBe(5900);

    const [txs] = await query(
      "SELECT * FROM policy_transactions WHERE policy_id = 1 AND type = 'PAYMENT'",
    );
    expect(txs.length).toBe(1);
    expect(Number(txs[0].amount)).toBe(-5900);

    const [payments] = await query("SELECT * FROM payments WHERE policy_id = 1");
    expect(payments.length).toBe(1);
    expect(Number(payments[0].amount)).toBe(5900);

    const [entries] = await query(
      `SELECT a.name, le.debit, le.credit
         FROM ledger_entries le
         JOIN accounts a ON a.id = le.account_id
        WHERE le.transaction_id = ?`,
      [txs[0].id],
    );
    expect(entries.length).toBe(2);
    const debitSum = entries.reduce((s, e) => s + Number(e.debit), 0);
    const creditSum = entries.reduce((s, e) => s + Number(e.credit), 0);
    expect(debitSum).toBe(5900);
    expect(creditSum).toBe(5900);
  });

  it("rejects overpayment with 422", async () => {
    await seedPolicy();

    const res = await request(app).post("/payments").send({
      policy_id: 1,
      amount: 20000,
      payment_date: "2026-09-06",
    });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("OVERPAYMENT");
  });

  it("rejects unknown policy with 404", async () => {
    const res = await request(app).post("/payments").send({
      policy_id: 999,
      amount: 100,
      payment_date: "2026-09-06",
    });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("POLICY_NOT_FOUND");
  });

  it("rejects negative amount with 422", async () => {
    await seedPolicy();

    const res = await request(app).post("/payments").send({
      policy_id: 1,
      amount: -5,
      payment_date: "2026-09-06",
    });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("INVALID_AMOUNT");
  });

  it("allows exact full settlement — outstanding becomes 0", async () => {
    await seedPolicy();

    const res = await request(app).post("/payments").send({
      policy_id: 1,
      amount: 11800,
      payment_date: "2026-09-06",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.outstanding_after_payment).toBe(0);

    const [entries] = await query(
      `SELECT a.name, le.debit, le.credit
         FROM ledger_entries le
         JOIN accounts a ON a.id = le.account_id
         JOIN policy_transactions pt ON pt.id = le.transaction_id
        WHERE pt.policy_id = 1 AND pt.type = 'PAYMENT'`,
    );
    const debitSum = entries.reduce((s, e) => s + Number(e.debit), 0);
    const creditSum = entries.reduce((s, e) => s + Number(e.credit), 0);
    expect(debitSum).toBe(11800);
    expect(creditSum).toBe(11800);
  });

  it("rejects second payment after full settlement", async () => {
    await seedPolicy();
    await request(app).post("/payments").send({
      policy_id: 1,
      amount: 11800,
      payment_date: "2026-09-06",
    });

    const res = await request(app).post("/payments").send({
      policy_id: 1,
      amount: 1,
      payment_date: "2026-09-07",
    });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("OVERPAYMENT");
  });

  it("rolls back everything when ledger insert fails", async () => {
    await seedPolicy();

    await query("UPDATE accounts SET name = 'Cash/Bank (hidden)' WHERE name = 'Cash/Bank'");

    try {
      const res = await request(app).post("/payments").send({
        policy_id: 1,
        amount: 5900,
        payment_date: "2026-09-06",
      });
      expect(res.status).toBe(500);

      const [txs] = await query("SELECT * FROM policy_transactions WHERE type = 'PAYMENT'");
      expect(txs.length).toBe(0);
      const [payments] = await query("SELECT * FROM payments");
      expect(payments.length).toBe(0);
    } finally {
      await query("UPDATE accounts SET name = 'Cash/Bank' WHERE name = 'Cash/Bank (hidden)'");
    }
  });
});
