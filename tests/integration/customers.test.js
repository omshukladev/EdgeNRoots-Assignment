import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { query, resetDatabase } from "../helpers/db.js";

describe("POST /customers (integration)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates a customer and returns 201", async () => {
    const res = await request(app).post("/customers").send({
      name: "Amit Sharma",
      email: "amit@example.com",
      phone: "9876543210",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: "Amit Sharma", email: "amit@example.com" });

    const [rows] = await query("SELECT * FROM customers WHERE email = ?", ["amit@example.com"]);
    expect(rows.length).toBe(1);
  });

  it("returns 409 for duplicate email", async () => {
    await query("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)", ["Amit Sharma", "amit@example.com", "9876543210"]);

    const res = await request(app).post("/customers").send({
      name: "Another Amit",
      email: "amit@example.com",
      phone: "9999999999",
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("DUPLICATE_EMAIL");
  });

  it("returns 422 for invalid email", async () => {
    const res = await request(app).post("/customers").send({
      name: "Bad Email",
      email: "not-an-email",
      phone: "9876543210",
    });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("INVALID_EMAIL");
  });

  it("returns 422 for missing name", async () => {
    const res = await request(app).post("/customers").send({
      email: "amit@example.com",
      phone: "9876543210",
    });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("INVALID_NAME");
  });
});
