import { db } from "../config/db.js";

const POLICY_ISSUE_ACCOUNTS = {
  receivable: "Customer Receivable",
  income: "Premium Income",
  gst: "GST Payable",
};

const findByPolicyNumber = async (policyNumber) => {
  const [rows] = await db.query(
    "SELECT * FROM policies WHERE policy_number = ? LIMIT 1",
    [policyNumber],
  );
  return rows[0] ?? null;
};

const findAccountIdByName = async (conn, name) => {
  const [rows] = await conn.query(
    "SELECT id FROM accounts WHERE name = ? LIMIT 1",
    [name],
  );
  if (!rows[0]) {
    throw new Error(`Account not found: ${name}`);
  }
  return rows[0].id;
};

// One MySQL transaction: policies + policy_transactions + ledger_entries.
// Any failure → ROLLBACK, nothing persists.
const createPolicyWithLedger = async ({
  customerId,
  policyNumber,
  premium,
  gstRate,
  gstAmount,
  totalPremium,
  startDate,
  endDate,
  ledgerEntries,
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [policyResult] = await conn.query(
      `INSERT INTO policies
        (customer_id, policy_number, premium, gst_rate, gst_amount, total_premium, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [customerId, policyNumber, premium, gstRate, gstAmount, totalPremium, startDate, endDate],
    );
    const policyId = policyResult.insertId;

    const [txResult] = await conn.query(
      "INSERT INTO policy_transactions (policy_id, type, amount) VALUES (?, 'ISSUE', ?)",
      [policyId, totalPremium],
    );
    const transactionId = txResult.insertId;

    const accountIds = {};
    for (const entry of ledgerEntries) {
      if (!accountIds[entry.accountName]) {
        accountIds[entry.accountName] = await findAccountIdByName(conn, entry.accountName);
      }
      await conn.query(
        "INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES (?, ?, ?, ?)",
        [transactionId, accountIds[entry.accountName], entry.debit, entry.credit],
      );
    }

    await conn.commit();
    return { policyId, transactionId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export default {
  POLICY_ISSUE_ACCOUNTS,
  findByPolicyNumber,
  createPolicyWithLedger,
  findAccountIdByName,
};
