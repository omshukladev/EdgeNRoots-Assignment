import "dotenv/config";
import mysql from "mysql2/promise";

const TEST_DB = process.env.DB_NAME_TEST;

let conn = null;

const getConnection = async () => {
  if (!conn) {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: TEST_DB,
      multipleStatements: true,
      decimalNumbers: true,
    });
  }
  return conn;
};

const resetDatabase = async () => {
  const c = await getConnection();
  await c.query("SET FOREIGN_KEY_CHECKS = 0");
  await c.query("TRUNCATE TABLE ledger_entries");
  await c.query("TRUNCATE TABLE payments");
  await c.query("TRUNCATE TABLE policy_transactions");
  await c.query("TRUNCATE TABLE policies");
  await c.query("TRUNCATE TABLE customers");
  await c.query("SET FOREIGN_KEY_CHECKS = 1");

  await c.query(`
    INSERT INTO accounts (id, code, name, type) VALUES
      (1, '1100', 'Customer Receivable', 'ASSET'),
      (2, '1200', 'Cash/Bank', 'ASSET'),
      (3, '4100', 'Premium Income', 'INCOME'),
      (4, '2100', 'GST Payable', 'LIABILITY')
    ON DUPLICATE KEY UPDATE code = VALUES(code)
  `);
};

const closeConnection = async () => {
  if (conn) {
    await conn.end();
    conn = null;
  }
};

const query = async (sql, params) => {
  const c = await getConnection();
  return c.query(sql, params);
};

export { getConnection, resetDatabase, closeConnection, query };
