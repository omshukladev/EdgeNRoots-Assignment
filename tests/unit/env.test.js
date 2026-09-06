import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadEnv } from "../../src/utils/env.js";

describe("loadEnv", () => {
  const required = ["PORT", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_NAME_TEST"];

  beforeEach(() => {
    for (const key of required) {
      process.env[key] = "x";
    }
    process.env.PORT = "3000";
    process.env.DB_PORT = "3306";
  });

  afterEach(() => {
    for (const key of required) {
      delete process.env[key];
    }
  });

  it("returns parsed config when all vars present", () => {
    const config = loadEnv();
    expect(config.port).toBe(3000);
    expect(config.db).toMatchObject({
      host: "x",
      port: 3306,
      user: "x",
      password: "x",
      database: "x",
      testDatabase: "x",
    });
  });

  it("throws when a required var is missing", () => {
    delete process.env.DB_NAME;
    expect(() => loadEnv()).toThrow(/DB_NAME/);
  });

  it("throws listing all missing vars", () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PASSWORD;
    expect(() => loadEnv()).toThrow(/DB_HOST/);
    expect(() => loadEnv()).toThrow(/DB_PASSWORD/);
  });

  it("falls back to default port 3000 when PORT is invalid", () => {
    process.env.PORT = "not-a-number";
    const config = loadEnv();
    expect(config.port).toBe(3000);
  });
});
