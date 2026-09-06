import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/policyReadRepository.js", () => ({
  default: {
    findPolicyById: vi.fn(),
    getPolicyDetail: vi.fn(),
    getPolicyLedger: vi.fn(),
    getPolicySummary: vi.fn(),
  },
}));

const { default: policyReadService } = await import("../../src/services/policyReadService.js");
const { default: policyReadRepository } = await import("../../src/repositories/policyReadRepository.js");

describe("policyReadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPolicyDetail shapes response with computed outstanding", async () => {
    policyReadRepository.getPolicyDetail.mockResolvedValue({
      id: 1,
      policy_number: "POL-2026-0001",
      customer_id: 1,
      customer_name: "Amit Sharma",
      customer_email: "amit@example.com",
      premium: "10000.00",
      gst_rate: "18.00",
      gst_amount: "1800.00",
      total_premium: "11800.00",
      start_date: "2026-09-01",
      end_date: "2027-08-31",
      status: "ACTIVE",
      outstanding: "5900.00",
      created_at: new Date(),
    });

    const result = await policyReadService.getPolicyDetail(1);

    expect(result).toMatchObject({
      id: 1,
      customer: { id: 1, name: "Amit Sharma", email: "amit@example.com" },
      premium: 10000,
      gst_rate: 18,
      gst_amount: 1800,
      total_premium: 11800,
      outstanding: 5900,
    });
  });

  it("getPolicyDetail throws 404 for unknown policy", async () => {
    policyReadRepository.getPolicyDetail.mockResolvedValue(null);
    await expect(policyReadService.getPolicyDetail(999)).rejects.toMatchObject({
      statusCode: 404,
      code: "POLICY_NOT_FOUND",
    });
  });

  it("getPolicyLedger throws 404 for unknown policy", async () => {
    policyReadRepository.findPolicyById.mockResolvedValue(null);
    await expect(policyReadService.getPolicyLedger(999)).rejects.toMatchObject({
      statusCode: 404,
      code: "POLICY_NOT_FOUND",
    });
  });

  it("getPolicySummary throws 404 for unknown policy", async () => {
    policyReadRepository.findPolicyById.mockResolvedValue(null);
    await expect(policyReadService.getPolicySummary(999)).rejects.toMatchObject({
      statusCode: 404,
      code: "POLICY_NOT_FOUND",
    });
  });

  it("throws 422 for invalid id", async () => {
    await expect(policyReadService.getPolicyDetail("abc")).rejects.toMatchObject({
      statusCode: 422,
      code: "INVALID_POLICY",
    });
  });
});
