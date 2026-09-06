import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/repositories/customerRepository.js", () => ({
  default: {
    createCustomer: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
  },
}));

const { default: customerService } = await import("../../src/services/customerService.js");
const { default: customerRepository } = await import("../../src/repositories/customerRepository.js");

describe("customerService.createCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a customer with trimmed + lowercased email", async () => {
    customerRepository.findByEmail.mockResolvedValue(null);
    customerRepository.createCustomer.mockResolvedValue({ id: 1, name: "Amit Sharma", email: "amit@example.com", phone: "9876543210" });

    const result = await customerService.createCustomer({ name: " Amit Sharma ", email: " AMIT@Example.com ", phone: "9876543210" });

    expect(customerRepository.findByEmail).toHaveBeenCalledWith("amit@example.com");
    expect(customerRepository.createCustomer).toHaveBeenCalledWith("Amit Sharma", "amit@example.com", "9876543210");
    expect(result.id).toBe(1);
  });

  it("rejects duplicate email with ConflictError", async () => {
    customerRepository.findByEmail.mockResolvedValue({ id: 1, email: "amit@example.com" });

    await expect(
      customerService.createCustomer({ name: "Amit Sharma", email: "amit@example.com", phone: "9876543210" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "DUPLICATE_EMAIL" });
  });

  it("rejects invalid email", async () => {
    await expect(
      customerService.createCustomer({ name: "Amit Sharma", email: "not-an-email", phone: "9876543210" }),
    ).rejects.toMatchObject({ statusCode: 422, code: "INVALID_EMAIL" });
  });

  it("rejects short name", async () => {
    await expect(
      customerService.createCustomer({ name: "A", email: "amit@example.com", phone: "9876543210" }),
    ).rejects.toMatchObject({ statusCode: 422, code: "INVALID_NAME" });
  });

  it("rejects bad phone", async () => {
    await expect(
      customerService.createCustomer({ name: "Amit Sharma", email: "amit@example.com", phone: "abc" }),
    ).rejects.toMatchObject({ statusCode: 422, code: "INVALID_PHONE" });
  });

  it("allows missing phone", async () => {
    customerRepository.findByEmail.mockResolvedValue(null);
    customerRepository.createCustomer.mockResolvedValue({ id: 2, name: "Amit Sharma", email: "amit@example.com", phone: null });

    const result = await customerService.createCustomer({ name: "Amit Sharma", email: "amit@example.com" });
    expect(result.id).toBe(2);
  });
});
