import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/paymentRepository.js", () => ({
  default: {
    PAYMENT_ACCOUNTS: { cash: "Cash/Bank", receivable: "Customer Receivable" },
    findPolicyById: vi.fn(),
    getOutstanding: vi.fn(),
    createPaymentWithLedger: vi.fn(),
  },
}));

const { default: paymentService } = await import("../../src/services/paymentService.js");
const { default: paymentRepository } = await import("../../src/repositories/paymentRepository.js");

describe("paymentService.recordPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = { policyId: 1, amount: 5900, paymentDate: "2026-09-06" };

  it("records payment and returns new outstanding", async () => {
    paymentRepository.findPolicyById.mockResolvedValue({ id: 1, total_premium: 11800 });
    paymentRepository.getOutstanding.mockResolvedValue(11800);
    paymentRepository.createPaymentWithLedger.mockResolvedValue({ transactionId: 10 });

    const result = await paymentService.recordPayment(validInput);

    expect(result.outstanding_after_payment).toBe(5900);
    expect(result.ledger_entries).toEqual([
      { accountName: "Cash/Bank", debit: 5900, credit: 0 },
      { accountName: "Customer Receivable", debit: 0, credit: 5900 },
    ]);
  });

  it("rejects unknown policy with NotFoundError", async () => {
    paymentRepository.findPolicyById.mockResolvedValue(null);

    await expect(paymentService.recordPayment(validInput)).rejects.toMatchObject({
      statusCode: 404,
      code: "POLICY_NOT_FOUND",
    });
  });

  it("rejects overpayment", async () => {
    paymentRepository.findPolicyById.mockResolvedValue({ id: 1 });
    paymentRepository.getOutstanding.mockResolvedValue(5900);

    await expect(
      paymentService.recordPayment({ ...validInput, amount: 6000 }),
    ).rejects.toMatchObject({ statusCode: 422, code: "OVERPAYMENT" });
  });

  it("rejects zero or negative amount", async () => {
    paymentRepository.findPolicyById.mockResolvedValue({ id: 1 });
    paymentRepository.getOutstanding.mockResolvedValue(11800);

    await expect(
      paymentService.recordPayment({ ...validInput, amount: 0 }),
    ).rejects.toMatchObject({ statusCode: 422, code: "INVALID_AMOUNT" });
    await expect(
      paymentService.recordPayment({ ...validInput, amount: -5 }),
    ).rejects.toMatchObject({ statusCode: 422, code: "INVALID_AMOUNT" });
  });

  it("rejects invalid payment date", async () => {
    paymentRepository.findPolicyById.mockResolvedValue({ id: 1 });
    paymentRepository.getOutstanding.mockResolvedValue(11800);

    await expect(
      paymentService.recordPayment({ ...validInput, paymentDate: "not-a-date" }),
    ).rejects.toMatchObject({ statusCode: 422, code: "INVALID_DATE" });
  });
});
