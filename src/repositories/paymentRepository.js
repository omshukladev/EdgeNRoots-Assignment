import { db } from "../config/db.js";

const PAYMENT_ACCOUNTS = {
  cash: "Cash/Bank",
  receivable: "Customer Receivable",
};

const findPolicyById = async (id) => {
  const [rows] = await db.query("SELECT * FROM policies WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
};

// Outstanding = SUM(issue amounts) − SUM(payment/reversal amounts)
// from policy_transactions — always computed, never stored.
const getOutstanding = async (policyId) => {
  const [rows] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'ISSUE' THEN amount ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN type IN ('PAYMENT', 'REVERSAL') THEN -amount ELSE 0 END), 0) AS outstanding
     FROM policy_transactions
     WHERE policy_id = ?`,
    [policyId],
  );
  return Number(rows[0].outstanding);
};

// One MySQL transaction: policy_transactions + payments + ledger_entries.
// Any failure → ROLLBACK, nothing persists.
const createPaymentWithLedger = async ({ policyId, amount, paymentDate, ledgerEntries }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [txResult] = await conn.query(
      "INSERT INTO policy_transactions (policy_id, type, amount, reference) VALUES (?, 'PAYMENT', ?, ?)",
      [policyId, -amount, paymentDate],
    );
    const transactionId = txResult.insertId;

    await conn.query(
      "INSERT INTO payments (policy_id, transaction_id, amount, payment_date) VALUES (?, ?, ?, ?)",
      [policyId, transactionId, amount, paymentDate],
    );

    const [accountRows] = await conn.query(
      "SELECT id, name FROM accounts WHERE name IN (?, ?)",
      [PAYMENT_ACCOUNTS.cash, PAYMENT_ACCOUNTS.receivable],
    );
    const accountIdByName = Object.fromEntries(accountRows.map((a) => [a.name, a.id]));

    for (const entry of ledgerEntries) {
      const accountId = accountIdByName[entry.accountName];
      if (!accountId) {
        throw new Error(`Account not found: ${entry.accountName}`);
      }
      await conn.query(
        "INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)",
        [transactionId, accountId, entry.debit, entry.credit],
      );
    }

    await conn.commit();
    return { transactionId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export default {
  PAYMENT_ACCOUNTS,
  findPolicyById,
  getOutstanding,
  createPaymentWithLedger,
};
