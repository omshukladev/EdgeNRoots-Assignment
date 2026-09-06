-- Test database seed: chart of accounts only (no business rows).
-- Schema for insurance_test is applied by scripts/db.js (migrate/fresh) —
-- this file runs AFTER schema.sql and only adds the accounts.
-- Business data is created per-test and truncated in test setup.

USE insurance_test;

INSERT INTO accounts (code, name, type) VALUES
  ('1100', 'Customer Receivable', 'ASSET'),
  ('1200', 'Cash/Bank', 'ASSET'),
  ('4100', 'Premium Income', 'INCOME'),
  ('2100', 'GST Payable', 'LIABILITY');
