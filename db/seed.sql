-- ============================================================
-- Sample Data — Insurance Policy & Accounting Module
-- Chart of accounts + rich demo data for all GET endpoints.
-- Every transaction's ledger entries balance (debit = credit).
-- Outstanding amounts are always computed, never stored.
-- Insert-only demonstration: POL-2026-0002 contains a REVERSAL
-- + corrected payment (no UPDATE/DELETE anywhere).
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Chart of Accounts
-- ------------------------------------------------------------
INSERT INTO accounts (code, name, type) VALUES
  ('1100', 'Customer Receivable', 'ASSET'),
  ('1200', 'Cash/Bank', 'ASSET'),
  ('4100', 'Premium Income', 'INCOME'),
  ('2100', 'GST Payable', 'LIABILITY');

-- ------------------------------------------------------------
-- Customers (5)
-- ------------------------------------------------------------
INSERT INTO customers (name, email, phone) VALUES
  ('Amit Sharma', 'amit@example.com', '9876543210'),
  ('Priya Patel', 'priya@example.com', '9123456780'),
  ('Rohan Mehta', 'rohan@example.com', '9988776655'),
  ('Sneha Iyer', 'sneha@example.com', '9000012345'),
  ('Vikram Singh', 'vikram@example.com', '9811122233');

-- ------------------------------------------------------------
-- Policies (6 — varied premiums + GST rates)
-- premium + gst = total. gst_amount = premium * rate/100.
-- ------------------------------------------------------------
INSERT INTO policies (customer_id, policy_number, premium, gst_rate, gst_amount, total_premium, start_date, end_date, status) VALUES
  (1, 'POL-2026-0001', 10000.00, 18.00,  1800.00,  11800.00, '2026-09-01', '2027-08-31', 'ACTIVE'),
  (2, 'POL-2026-0002', 25000.00, 18.00,  4500.00,  29500.00, '2026-08-15', '2027-08-14', 'ACTIVE'),
  (3, 'POL-2026-0003', 50000.00,  5.00,  2500.00,  52500.00, '2026-07-01', '2027-06-30', 'ACTIVE'),
  (4, 'POL-2026-0004', 200000.00, 12.00, 24000.00, 224000.00, '2026-06-01', '2027-05-31', 'ACTIVE'),
  (5, 'POL-2026-0005', 75000.00,  0.00,     0.00,  75000.00, '2026-09-01', '2027-08-31', 'ACTIVE'),
  (1, 'POL-2026-0006', 100000.00, 28.00, 28000.00, 128000.00, '2026-05-01', '2027-04-30', 'ACTIVE');

-- ------------------------------------------------------------
-- policy_transactions (audit trail; + amount = ISSUE,
-- - amount = PAYMENT; REVERSAL re-opens receivable)
-- ------------------------------------------------------------
INSERT INTO policy_transactions (policy_id, type, amount, reference) VALUES
  (1, 'ISSUE',     11800.00,  NULL),
  (1, 'PAYMENT',  -5900.00,   'PAY-0001'),
  (2, 'ISSUE',     29500.00,  NULL),
  (2, 'PAYMENT',  -15000.00,  'PAY-0002'),
  (2, 'REVERSAL',  15000.00,  'REV-PAY-0002'),
  (2, 'PAYMENT',  -12500.00,  'PAY-0002-CORR'),
  (3, 'ISSUE',     52500.00,  NULL),
  (3, 'PAYMENT',  -52500.00,  'PAY-0003'),
  (4, 'ISSUE',    224000.00,  NULL),
  (4, 'PAYMENT',  -50000.00,  'PAY-0004'),
  (5, 'ISSUE',     75000.00,  NULL),
  (6, 'ISSUE',    128000.00,  NULL);

-- ------------------------------------------------------------
-- payments (1:1 with PAYMENT transactions; note the REVERSAL
-- has no payment row — it only corrects the ledger)
-- ------------------------------------------------------------
INSERT INTO payments (policy_id, transaction_id, amount, payment_date) VALUES
  (1, 2,  5900.00,  '2026-09-06'),
  (2, 4,  15000.00, '2026-08-20'),
  (2, 6,  12500.00, '2026-08-21'),
  (3, 8,  52500.00, '2026-07-15'),
  (4, 10, 50000.00, '2026-06-10');

-- ------------------------------------------------------------
-- ledger_entries — double-entry for every transaction above.
-- Dr total === Cr total for every transaction_id.
-- ------------------------------------------------------------
-- t1: ISSUE policy 1 — Dr Receivable 11,800 / Cr Income 10,000 / Cr GST 1,800
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (1, 1, 11800.00, 0.00),
  (1, 3, 0.00, 10000.00),
  (1, 4, 0.00, 1800.00);

-- t2: PAYMENT 5,900 — Dr Cash / Cr Receivable
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (2, 2, 5900.00, 0.00),
  (2, 1, 0.00, 5900.00);

-- t3: ISSUE policy 2 — Dr Receivable 29,500 / Cr Income 25,000 / Cr GST 4,500
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (3, 1, 29500.00, 0.00),
  (3, 3, 0.00, 25000.00),
  (3, 4, 0.00, 4500.00);

-- t4: PAYMENT 15,000 (WRONG amount — later reversed) — Dr Cash / Cr Receivable
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (4, 2, 15000.00, 0.00),
  (4, 1, 0.00, 15000.00);

-- t5: REVERSAL of t4 — Dr Receivable / Cr Cash (re-opens receivable)
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (5, 1, 15000.00, 0.00),
  (5, 2, 0.00, 15000.00);

-- t6: CORRECTED PAYMENT 12,500 — Dr Cash / Cr Receivable
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (6, 2, 12500.00, 0.00),
  (6, 1, 0.00, 12500.00);

-- t7: ISSUE policy 3 — Dr Receivable 52,500 / Cr Income 50,000 / Cr GST 2,500
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (7, 1, 52500.00, 0.00),
  (7, 3, 0.00, 50000.00),
  (7, 4, 0.00, 2500.00);

-- t8: FULL SETTLEMENT 52,500 — Dr Cash / Cr Receivable
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (8, 2, 52500.00, 0.00),
  (8, 1, 0.00, 52500.00);

-- t9: ISSUE policy 4 — Dr Receivable 224,000 / Cr Income 200,000 / Cr GST 24,000
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (9, 1, 224000.00, 0.00),
  (9, 3, 0.00, 200000.00),
  (9, 4, 0.00, 24000.00);

-- t10: PAYMENT 50,000 — Dr Cash / Cr Receivable
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (10, 2, 50000.00, 0.00),
  (10, 1, 0.00, 50000.00);

-- t11: ISSUE policy 5 (0% GST → 2 lines only) — Dr Receivable / Cr Income
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (11, 1, 75000.00, 0.00),
  (11, 3, 0.00, 75000.00);

-- t12: ISSUE policy 6 — Dr Receivable 128,000 / Cr Income 100,000 / Cr GST 28,000
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (12, 1, 128000.00, 0.00),
  (12, 3, 0.00, 100000.00),
  (12, 4, 0.00, 28000.00);
