import { ValidationError } from "./errors.js";
import { round2 } from "./gst.js";

const assertBalanced = (entries, label = "ledger entries") => {
  const totalDebit = round2(entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0));
  const totalCredit = round2(entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0));
  if (totalDebit !== totalCredit) {
    throw new ValidationError(
      `Unbalanced ${label}: debit ${totalDebit} does not equal credit ${totalCredit}`,
      [],
      "UNBALANCED_LEDGER",
    );
  }
  return { totalDebit, totalCredit, balanced: true };
};

const makeEntry = (accountName, debit = 0, credit = 0) => ({
  accountName,
  debit: round2(debit),
  credit: round2(credit),
});

export { assertBalanced, makeEntry };
