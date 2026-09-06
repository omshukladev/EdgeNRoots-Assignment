-- Test database: same chart of accounts, no business rows.
-- Business data is created per-test and truncated in setup.

CREATE DATABASE IF NOT EXISTS insurance_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE insurance_test;

SOURCE /docker-entrypoint-initdb.d/schema.sql;

INSERT INTO accounts (code, name, type) VALUES
  ('1100', 'Customer Receivable', 'ASSET'),
  ('1200', 'Cash/Bank', 'ASSET'),
  ('4100', 'Premium Income', 'INCOME'),
  ('2100', 'GST Payable', 'LIABILITY');
