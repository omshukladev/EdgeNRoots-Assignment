-- Insurance Policy & Accounting Module — Schema
-- MySQL 8.4 LTS
-- Insert-only architecture: no UPDATE/DELETE on business data in app code.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customers_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS policies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  policy_number VARCHAR(50) NOT NULL,
  premium DECIMAL(14,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  gst_amount DECIMAL(14,2) NOT NULL,
  total_premium DECIMAL(14,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_policies_policy_number (policy_number),
  KEY idx_policies_customer (customer_id),
  CONSTRAINT fk_policies_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS policy_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  policy_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'ISSUE, PAYMENT, REVERSAL, CORRECTION',
  amount DECIMAL(14,2) NOT NULL COMMENT 'signed effect on outstanding: + for ISSUE, - for PAYMENT',
  reference VARCHAR(50) NULL COMMENT 'links reversals to original transaction',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pt_policy_created (policy_id, created_at),
  KEY idx_pt_type (type),
  CONSTRAINT fk_pt_policy FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  policy_id BIGINT UNSIGNED NOT NULL,
  transaction_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_payments_policy (policy_id),
  UNIQUE KEY uq_payments_transaction (transaction_id),
  CONSTRAINT fk_payments_policy FOREIGN KEY (policy_id) REFERENCES policies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_transaction FOREIGN KEY (transaction_id) REFERENCES policy_transactions (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'ASSET, LIABILITY, INCOME, EXPENSE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_accounts_code (code),
  UNIQUE KEY uq_accounts_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id BIGINT UNSIGNED NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL,
  debit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  credit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_le_transaction (transaction_id),
  KEY idx_le_account (account_id),
  CONSTRAINT fk_le_transaction FOREIGN KEY (transaction_id) REFERENCES policy_transactions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_le_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT,
  CONSTRAINT chk_le_one_sided CHECK (debit = 0 OR credit = 0)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
