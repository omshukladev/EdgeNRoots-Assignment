import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { query, resetDatabase } from "../helpers/db.js";

const seedCustomer = async () => {
  const [r] = await query(
    "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
    ["Amit Sharma", "amit@example.com", "9876543210"],
  );
  return r.insertId;
};

describe("POST /policies (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  const validPayload = (customerId) => ({
    customer_id: customerId,
    policy_number: "POL-2026-0002",
    premium: 10000,
    gst_rate: 18,
    start_date: "2026-09-01",
    end_date: "2027-08-31",
  });

  it("creates policy + balanced 3-line ledger atomically", async () => {
    const customerId = await seedCustomer();

    const res = await request(app).post("/policies").send(validPayload(customerId));

    expect(res.status).toBe(201);
    expect(res.body.data.policy).toMatchObject({
      premium: 10000,
      gst_rate: 18,
      gst_amount: 1800,
      total_premium: 11800,
    });

    const [policies] = await query("SELECT * FROM policies WHERE policy_number = ?", ["POL-2026-0002"]);
    expect(policies.length).toBe(1);
    const policyId = policies[0].id;

    const [txs] = await query("SELECT * FROM policy_transactions WHERE policy_id = ?", [policyId]);
    expect(txs.length).toBe(1);
    expect(txs[0].type).toBe("ISSUE");
    expect(Number(txs[0].amount)).toBe(11800);

    const [entries] = await query(
      `SELECT a.name, le.debit, le.credit
         FROM ledger_entries le
         JOIN accounts a ON a.id = le.account_id
        WHERE le.transaction_id = ?`,
      [txs[0].id],
    );
    expect(entries.length).toBe(3);

    const debitSum = entries.reduce((s, e) => s + Number(e.debit), 0);
    const creditSum = entries.reduce((s, e) => s + Number(e.credit), 0);
    expect(debitSum).toBe(11800);
    expect(creditSum).toBe(11800);
    expect(debitSum).toBe(creditSum);
  });

  it("returns 409 for duplicate policy number", async () => {
    const customerId = await seedCustomer();
    await request(app).post("/policies").send(validPayload(customerId));

    const res = await request(app).post("/policies").send(validPayload(customerId));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("DUPLICATE_POLICY_NUMBER");
  });

  it("returns 404 for unknown customer", async () => {
    const res = await request(app).post("/policies").send(validPayload(999));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("CUSTOMER_NOT_FOUND");
  });

  it("returns 422 for premium <= 0", async () => {
    const customerId = await seedCustomer();
    const res = await request(app).post("/policies").send({ ...validPayload(customerId), premium: 0 });
    expect(res.status).toBe(422);
  });

  it("rolls back everything when a ledger insert fails", async () => {
    const customerId = await seedCustomer();

    // Temporarily rename the Premium Income account so the ledger lookup
    // fails mid-transaction — AFTER policies + policy_transactions were
    // inserted. The transaction must roll back all three inserts.
    await query("UPDATE accounts SET name = 'Premium Income (hidden)' WHERE name = 'Premium Income'");

    try {
      const res = await request(app).post("/policies").send(validPayload(customerId));
      expect(res.status).toBe(500);

      const [policies] = await query("SELECT * FROM policies");
      expect(policies.length).toBe(0);
      const [txs] = await query("SELECT * FROM policy_transactions");
      expect(txs.length).toBe(0);
    } finally {
      await query("UPDATE accounts SET name = 'Premium Income' WHERE name = 'Premium Income (hidden)'");
    }
  });
});
