import {
  NotFoundError,
  ValidationError,
  OverpaymentError,
  assertBalanced,
  makeEntry,
  isValidAmount,
  isValidDate,
} from "../utils/index.js";
import paymentRepository from "../repositories/paymentRepository.js";

const recordPayment = async ({ policyId, amount, paymentDate }) => {
  if (!Number.isInteger(Number(policyId)) || Number(policyId) <= 0) {
    throw new ValidationError("Invalid policy_id", [], "INVALID_POLICY");
  }
  if (!isValidAmount(amount)) {
    throw new ValidationError("Amount must be a positive number with max 2 decimals", [], "INVALID_AMOUNT");
  }
  if (!isValidDate(paymentDate)) {
    throw new ValidationError("Payment date must be a valid YYYY-MM-DD", [], "INVALID_DATE");
  }

  const policy = await paymentRepository.findPolicyById(Number(policyId));
  if (!policy) {
    throw new NotFoundError(`Policy ${policyId} not found`, "POLICY_NOT_FOUND");
  }

  const outstanding = await paymentRepository.getOutstanding(Number(policyId));
  const roundedAmount = Math.round(amount * 100) / 100;

  if (roundedAmount > outstanding) {
    throw new OverpaymentError(
      `Payment ${roundedAmount} exceeds outstanding ${outstanding}`,
      "OVERPAYMENT",
    );
  }

  // Double-entry: Dr Cash/Bank / Cr Customer Receivable
  const ledgerEntries = [
    makeEntry(paymentRepository.PAYMENT_ACCOUNTS.cash, roundedAmount, 0),
    makeEntry(paymentRepository.PAYMENT_ACCOUNTS.receivable, 0, roundedAmount),
  ];

  // Debit must equal credit BEFORE touching the DB.
  assertBalanced(ledgerEntries, "payment ledger");

  const { transactionId } = await paymentRepository.createPaymentWithLedger({
    policyId: Number(policyId),
    amount: roundedAmount,
    paymentDate,
    ledgerEntries,
  });

  return {
    payment: {
      policy_id: Number(policyId),
      transaction_id: transactionId,
      amount: roundedAmount,
      payment_date: paymentDate,
    },
    outstanding_after_payment: Math.round((outstanding - roundedAmount) * 100) / 100,
    ledger_entries: ledgerEntries,
  };
};

export default { recordPayment };
