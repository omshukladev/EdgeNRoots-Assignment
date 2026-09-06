import { describe, it, expect } from "vitest";
import { assertBalanced, makeEntry } from "../../src/utils/index.js";

describe("ledger balance", () => {
  it("passes for balanced entries", () => {
    const entries = [
      makeEntry("Customer Receivable", 11800, 0),
      makeEntry("Premium Income", 0, 10000),
      makeEntry("GST Payable", 0, 1800),
    ];
    const result = assertBalanced(entries);
    expect(result).toEqual({ totalDebit: 11800, totalCredit: 11800, balanced: true });
  });

  it("throws for unbalanced entries", () => {
    const entries = [makeEntry("Cash", 100, 0), makeEntry("Receivable", 0, 50)];
    expect(() => assertBalanced(entries)).toThrow(/Unbalanced/);
  });
});
