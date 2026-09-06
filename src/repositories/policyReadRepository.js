import { db } from "../config/db.js";

const findPolicyById = async (id) => {
  const [rows] = await db.query("SELECT * FROM policies WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
};

// JOIN: policies + customers, computed outstanding via SUM/CASE on policy_transactions.
const getPolicyDetail = async (id) => {
  const [rows] = await db.query(
    `SELECT
       p.id, p.policy_number, p.premium, p.gst_rate, p.gst_amount, p.total_premium,
       p.start_date, p.end_date, p.status, p.created_at,
       c.id AS customer_id, c.name AS customer_name, c.email AS customer_email,
       COALESCE(SUM(CASE WHEN pt.type = 'ISSUE' THEN pt.amount ELSE 0 END), 0) -
       COALESCE(SUM(CASE WHEN pt.type IN ('PAYMENT', 'REVERSAL') THEN -pt.amount ELSE 0 END), 0) AS outstanding
     FROM policies p
     JOIN customers c ON c.id = p.customer_id
     LEFT JOIN policy_transactions pt ON pt.policy_id = p.id
     WHERE p.id = ?
     GROUP BY p.id, c.id`,
    [id],
  );
  return rows[0] ?? null;
};

// JOIN: policy_transactions + ledger_entries + accounts, chronological audit trail.
const getPolicyLedger = async (id) => {
  const [txs] = await db.query(
    `SELECT id, type, amount, reference, created_at
       FROM policy_transactions
      WHERE policy_id = ?
      ORDER BY created_at ASC, id ASC`,
    [id],
  );

  if (txs.length === 0) {
    return { transactions: [], total_debit: 0, total_credit: 0 };
  }

  const ids = txs.map((t) => t.id);
  const [entries] = await db.query(
    `SELECT le.transaction_id, a.name AS account, le.debit, le.credit
       FROM ledger_entries le
       JOIN accounts a ON a.id = le.account_id
      WHERE le.transaction_id IN (${ids.map(() => "?").join(",")})
      ORDER BY le.transaction_id ASC, le.id ASC`,
    ids,
  );

  const entriesByTx = new Map();
  for (const e of entries) {
    if (!entriesByTx.has(e.transaction_id)) {
      entriesByTx.set(e.transaction_id, []);
    }
    entriesByTx.get(e.transaction_id).push({
      account: e.account,
      debit: Number(e.debit),
      credit: Number(e.credit),
    });
  }

  let totalDebit = 0;
  let totalCredit = 0;
  const transactions = txs.map((t) => {
    const txEntries = entriesByTx.get(t.id) ?? [];
    for (const e of txEntries) {
      totalDebit += e.debit;
      totalCredit += e.credit;
    }
    return {
      transaction_id: t.id,
      type: t.type,
      amount: Number(t.amount),
      reference: t.reference,
      created_at: t.created_at,
      entries: txEntries,
    };
  });

  return {
    transactions,
    total_debit: Math.round(totalDebit * 100) / 100,
    total_credit: Math.round(totalCredit * 100) / 100,
  };
};

// GROUP BY + SUM + CASE: derived per-account balances, zero stored totals.
const getPolicySummary = async (id) => {
  const [rows] = await db.query(
    `SELECT
       a.name AS account,
       SUM(le.debit)  AS total_debit,
       SUM(le.credit) AS total_credit,
       CASE
         WHEN SUM(le.debit) >= SUM(le.credit) THEN CONCAT('Debit ', SUM(le.debit) - SUM(le.credit))
         ELSE CONCAT('Credit ', SUM(le.credit) - SUM(le.debit))
       END AS net
     FROM ledger_entries le
     JOIN policy_transactions pt ON pt.id = le.transaction_id
     JOIN accounts a ON a.id = le.account_id
     WHERE pt.policy_id = ?
     GROUP BY a.id, a.name
     ORDER BY a.name ASC`,
    [id],
  );

  const totalDebit = rows.reduce((s, r) => s + Number(r.total_debit), 0);
  const totalCredit = rows.reduce((s, r) => s + Number(r.total_credit), 0);

  return {
    accounts: rows.map((r) => ({
      account: r.account,
      total_debit: Number(r.total_debit),
      total_credit: Number(r.total_credit),
      net: r.net,
    })),
    total_debit: Math.round(totalDebit * 100) / 100,
    total_credit: Math.round(totalCredit * 100) / 100,
    balanced: Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
  };
};

export default { findPolicyById, getPolicyDetail, getPolicyLedger, getPolicySummary };
