import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPhone,
  isValidPolicyNumber,
  isValidAmount,
  isValidGstRate,
  isValidDate,
  isValidId,
} from "../../src/utils/index.js";

describe("validators", () => {
  it("email", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
  });

  it("phone: digits 7-15 or empty", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("")).toBe(true);
    expect(isValidPhone(undefined)).toBe(true);
  });

  it("policy number: alphanumeric + dashes 4-50 chars", () => {
    expect(isValidPolicyNumber("POL-2026-0001")).toBe(true);
    expect(isValidPolicyNumber("ab")).toBe(false);
    expect(isValidPolicyNumber("POL!")).toBe(false);
  });

  it("amount: positive, max 2dp, finite", () => {
    expect(isValidAmount(5900)).toBe(true);
    expect(isValidAmount(5900.5)).toBe(true);
    expect(isValidAmount(5900.999)).toBe(false);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-5)).toBe(false);
    expect(isValidAmount(NaN)).toBe(false);
    expect(isValidAmount(Infinity)).toBe(false);
  });

  it("gst rate: 0-100", () => {
    expect(isValidGstRate(18)).toBe(true);
    expect(isValidGstRate(0)).toBe(true);
    expect(isValidGstRate(100)).toBe(true);
    expect(isValidGstRate(101)).toBe(false);
    expect(isValidGstRate(-1)).toBe(false);
  });

  it("date: strict YYYY-MM-DD real dates", () => {
    expect(isValidDate("2026-09-06")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("06/09/2026")).toBe(false);
    expect(isValidDate("not-a-date")).toBe(false);
  });

  it("id: positive integer", () => {
    expect(isValidId(1)).toBe(true);
    expect(isValidId("2")).toBe(true);
    expect(isValidId(0)).toBe(false);
    expect(isValidId(-1)).toBe(false);
    expect(isValidId("abc")).toBe(false);
  });
});
