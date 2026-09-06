import {
  ConflictError,
  ValidationError,
  NotFoundError,
  calculateGst,
  assertBalanced,
  makeEntry,
  isValidPolicyNumber,
  isValidGstRate,
  isValidDate,
} from "../utils/index.js";
import customerRepository from "../repositories/customerRepository.js";
import policyRepository from "../repositories/policyRepository.js";

const createPolicy = async ({
  customerId,
  policyNumber,
  premium,
  gstRate,
  startDate,
  endDate,
}) => {
  if (!Number.isInteger(Number(customerId)) || Number(customerId) <= 0) {
    throw new ValidationError("Invalid customer_id", [], "INVALID_CUSTOMER");
  }
  if (!isValidPolicyNumber(policyNumber)) {
    throw new ValidationError("Invalid policy number", [], "INVALID_POLICY_NUMBER");
  }
  if (!isValidGstRate(gstRate)) {
    throw new ValidationError("GST rate must be between 0 and 100", [], "INVALID_GST_RATE");
  }
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new ValidationError("Dates must be valid YYYY-MM-DD", [], "INVALID_DATES");
  }

  const customer = await customerRepository.findById(Number(customerId));
  if (!customer) {
    throw new NotFoundError(`Customer ${customerId} not found`, "CUSTOMER_NOT_FOUND");
  }

  const existing = await policyRepository.findByPolicyNumber(policyNumber.trim());
  if (existing) {
    throw new ConflictError("A policy with this number already exists", "DUPLICATE_POLICY_NUMBER");
  }

  const { premium: p, gstRate: r, gstAmount, totalPremium } = calculateGst(premium, gstRate);

  // Double-entry rows (assignment example): Dr Receivable total / Cr Income premium / Cr GST gst
  const ledgerEntries = [
    makeEntry(policyRepository.POLICY_ISSUE_ACCOUNTS.receivable, totalPremium, 0),
    makeEntry(policyRepository.POLICY_ISSUE_ACCOUNTS.income, 0, p),
    makeEntry(policyRepository.POLICY_ISSUE_ACCOUNTS.gst, 0, gstAmount),
  ];

  // Debit must equal credit BEFORE we touch the DB.
  assertBalanced(ledgerEntries, "policy issue ledger");

  const { policyId, transactionId } = await policyRepository.createPolicyWithLedger({
    customerId: Number(customerId),
    policyNumber: policyNumber.trim(),
    premium: p,
    gstRate: r,
    gstAmount,
    totalPremium,
    startDate,
    endDate,
    ledgerEntries,
  });

  return {
    policy: {
      id: policyId,
      customer_id: Number(customerId),
      policy_number: policyNumber.trim(),
      premium: p,
      gst_rate: r,
      gst_amount: gstAmount,
      total_premium: totalPremium,
      start_date: startDate,
      end_date: endDate,
      status: "ACTIVE",
    },
    transaction_id: transactionId,
    ledger_entries: ledgerEntries,
  };
};

export default { createPolicy };
