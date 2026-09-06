-- Sample data: chart of accounts + one full worked example.
-- Every ledger entry is balanced; outstanding is always computed, never stored.

SET NAMES utf8mb4;

INSERT INTO accounts (code, name, type) VALUES
  ('1100', 'Customer Receivable', 'ASSET'),
  ('1200', 'Cash/Bank', 'ASSET'),
  ('4100', 'Premium Income', 'INCOME'),
  ('2100', 'GST Payable', 'LIABILITY');

-- Example customer
INSERT INTO customers (name, email, phone) VALUES
  ('Amit Sharma', 'amit@example.com', '9876543210');

-- Example policy: premium 10,000 + 18% GST = 11,800 total
INSERT INTO policies (customer_id, policy_number, premium, gst_rate, gst_amount, total_premium, start_date, end_date, status) VALUES
  (1, 'POL-2026-0001', 10000.00, 18.00, 1800.00, 11800.00, '2026-09-01', '2027-08-31', 'ACTIVE');

-- ISSUE transaction (signed: +11800 on outstanding)
INSERT INTO policy_transactions (policy_id, type, amount, reference) VALUES
  (1, 'ISSUE', 11800.00, NULL);

-- Double-entry for the ISSUE: Dr Receivable 11,800 / Cr Premium Income 10,000 / Cr GST Payable 1,800
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (1, 1, 11800.00, 0.00),
  (1, 3, 0.00, 10000.00),
  (1, 4, 0.00, 1800.00);

-- Partial payment of 5,900
INSERT INTO policy_transactions (policy_id, type, amount, reference) VALUES
  (1, 'PAYMENT', -5900.00, 'PAY-0001');

INSERT INTO payments (policy_id, transaction_id, amount, payment_date) VALUES
  (1, 2, 5900.00, '2026-09-06');

-- Double-entry for the payment: Dr Cash/Bank 5,900 / Cr Receivable 5,900
INSERT INTO ledger_entries (transaction_id, account_id, debit, credit) VALUES
  (2, 2, 5900.00, 0.00),
  (2, 1, 0.00, 5900.00);
