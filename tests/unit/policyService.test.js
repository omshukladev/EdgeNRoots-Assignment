import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/customerRepository.js", () => ({
  default: { findById: vi.fn() },
}));
vi.mock("../../src/repositories/policyRepository.js", () => ({
  default: {
    POLICY_ISSUE_ACCOUNTS: { receivable: "Customer Receivable", income: "Premium Income", gst: "GST Payable" },
    findByPolicyNumber: vi.fn(),
    createPolicyWithLedger: vi.fn(),
  },
}));

const { default: policyService } = await import("../../src/services/policyService.js");
const { default: customerRepository } = await import("../../src/repositories/customerRepository.js");
const { default: policyRepository } = await import("../../src/repositories/policyRepository.js");

describe("policyService.createPolicy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    customerId: 1,
    policyNumber: "POL-2026-0002",
    premium: 10000,
    gstRate: 18,
    startDate: "2026-09-01",
    endDate: "2027-08-31",
  };

  it("creates policy with balanced 3-line ledger", async () => {
    customerRepository.findById.mockResolvedValue({ id: 1, name: "Amit" });
    policyRepository.findByPolicyNumber.mockResolvedValue(null);
    policyRepository.createPolicyWithLedger.mockResolvedValue({ policyId: 2, transactionId: 2 });

    const result = await policyService.createPolicy(validInput);

    expect(result.policy).toMatchObject({
      premium: 10000,
      gst_rate: 18,
      gst_amount: 1800,
      total_premium: 11800,
    });
    expect(result.ledger_entries).toEqual([
      { accountName: "Customer Receivable", debit: 11800, credit: 0 },
      { accountName: "Premium Income", debit: 0, credit: 10000 },
      { accountName: "GST Payable", debit: 0, credit: 1800 },
    ]);
  });

  it("rejects duplicate policy number", async () => {
    customerRepository.findById.mockResolvedValue({ id: 1 });
    policyRepository.findByPolicyNumber.mockResolvedValue({ id: 1, policy_number: "POL-2026-0002" });

    await expect(policyService.createPolicy(validInput)).rejects.toMatchObject({
      statusCode: 409,
      code: "DUPLICATE_POLICY_NUMBER",
    });
  });

  it("rejects unknown customer", async () => {
    customerRepository.findById.mockResolvedValue(null);
    policyRepository.findByPolicyNumber.mockResolvedValue(null);

    await expect(policyService.createPolicy(validInput)).rejects.toMatchObject({
      statusCode: 404,
      code: "CUSTOMER_NOT_FOUND",
    });
  });

  it("rejects premium <= 0", async () => {
    customerRepository.findById.mockResolvedValue({ id: 1 });
    policyRepository.findByPolicyNumber.mockResolvedValue(null);

    await expect(policyService.createPolicy({ ...validInput, premium: -5 })).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it("rejects invalid GST rate", async () => {
    customerRepository.findById.mockResolvedValue({ id: 1 });
    policyRepository.findByPolicyNumber.mockResolvedValue(null);

    await expect(policyService.createPolicy({ ...validInput, gstRate: 101 })).rejects.toMatchObject({
      statusCode: 422,
      code: "INVALID_GST_RATE",
    });
  });

  it("rejects bad dates", async () => {
    customerRepository.findById.mockResolvedValue({ id: 1 });
    policyRepository.findByPolicyNumber.mockResolvedValue(null);

    await expect(policyService.createPolicy({ ...validInput, endDate: "not-a-date" })).rejects.toMatchObject({
      statusCode: 422,
      code: "INVALID_DATES",
    });
  });
});
