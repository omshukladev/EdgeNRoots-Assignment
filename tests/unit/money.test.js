import { describe, it, expect } from "vitest";
import { parseMoney } from "../../src/utils/index.js";

describe("parseMoney", () => {
  it("parses plain number strings", () => {
    expect(parseMoney("10000")).toBe(10000);
  });

  it("parses decimals with 1-2 places", () => {
    expect(parseMoney("10000.50")).toBe(10000.5);
    expect(parseMoney("10000.5")).toBe(10000.5);
  });

  it("parses Indian currency format with ₹ and commas", () => {
    expect(parseMoney("₹10,000")).toBe(10000);
    expect(parseMoney("₹1,00,000.50")).toBe(100000.5);
  });

  it("parses plain comma-formatted numbers", () => {
    expect(parseMoney("10,000")).toBe(10000);
    expect(parseMoney("1,23,456.78")).toBe(123456.78);
  });

  it("accepts numbers directly", () => {
    expect(parseMoney(10000)).toBe(10000);
    expect(parseMoney(10000.25)).toBe(10000.25);
  });

  it("rejects garbage strings", () => {
    expect(() => parseMoney("abc")).toThrow();
    expect(() => parseMoney("₹")).toThrow();
    expect(() => parseMoney("10.999.99")).toThrow();
  });

  it("rejects non-number non-string input", () => {
    expect(() => parseMoney(null)).toThrow();
    expect(() => parseMoney(undefined)).toThrow();
    expect(() => parseMoney({})).toThrow();
  });

  it("rejects more than 2 decimal places", () => {
    expect(() => parseMoney("10.999")).toThrow();
  });
});
