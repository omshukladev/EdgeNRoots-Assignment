import { describe, it, expect } from "vitest";
import { calculateGst } from "../../src/utils/index.js";

describe("calculateGst", () => {
  it("computes GST and total for 10,000 @ 18%", () => {
    const result = calculateGst(10000, 18);
    expect(result).toEqual({ premium: 10000, gstRate: 18, gstAmount: 1800, totalPremium: 11800 });
  });

  it("computes GST and total for 10,000 @ 0%", () => {
    const result = calculateGst(10000, 0);
    expect(result).toEqual({ premium: 10000, gstRate: 0, gstAmount: 0, totalPremium: 10000 });
  });

  it("rounds to 2 decimals", () => {
    const result = calculateGst(9999.99, 18);
    expect(result.gstAmount).toBe(1800);
    expect(result.totalPremium).toBe(11799.99);
  });

  it("rejects negative premium", () => {
    expect(() => calculateGst(-100, 18)).toThrow();
  });

  it("rejects invalid GST rate", () => {
    expect(() => calculateGst(10000, 101)).toThrow();
  });
});
