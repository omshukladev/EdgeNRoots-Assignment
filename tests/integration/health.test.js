import "dotenv/config";
import { describe, it, expect } from "vitest";
import request from "supertest";
import mysql from "mysql2/promise";
import app from "../../src/app.js";

let dbUp = false;
try {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await conn.query("SELECT 1");
  await conn.end();
  dbUp = true;
} catch {
  dbUp = false;
}

describe("GET /health", () => {
  it.skipIf(!dbUp)("returns 200 with db connected when MySQL is up", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.db).toBe("connected");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
