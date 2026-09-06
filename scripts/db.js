import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const DB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../db");
const SCHEMA_FILE = resolve(DB_DIR, "schema.sql");
const SEED_FILE = resolve(DB_DIR, "seed.sql");
const TEST_FILE = resolve(DB_DIR, "test.sql");

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_NAME_TEST,
  DB_ROOT_USER = "root",
  DB_ROOT_PASSWORD = "rootpass",
} = process.env;

const baseConfig = {
  host: DB_HOST,
  port: Number(DB_PORT) || 3306,
  user: DB_ROOT_USER,
  password: DB_ROOT_PASSWORD,
  multipleStatements: true,
};

const adminConnection = () => mysql.createConnection(baseConfig);

const dbConnection = (database) =>
  mysql.createConnection({ ...baseConfig, database });

const runFile = async (conn, file, label) => {
  const sql = await readFile(file, "utf8");
  await conn.query(sql);
  console.log(`  ✔ ${label} applied`);
};

const createDatabase = async (conn, name) => {
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`  ✔ database \`${name}\` ready`);
};

const resetDatabase = async (conn, name) => {
  await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
  await conn.query(
    `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`  ✔ database \`${name}\` recreated`);
};

// Applies schema.sql to a database (idempotent — safe to re-run).
const migrate = async () => {
  console.log(`\n→ migrate: applying schema to ${DB_NAME} + ${DB_NAME_TEST}`);
  const admin = await adminConnection();
  try {
    await createDatabase(admin, DB_NAME);
    await createDatabase(admin, DB_NAME_TEST);

    const main = await dbConnection(DB_NAME);
    await runFile(main, SCHEMA_FILE, `schema → ${DB_NAME}`);
    await main.end();

    const test = await dbConnection(DB_NAME_TEST);
    await runFile(test, SCHEMA_FILE, `schema → ${DB_NAME_TEST}`);
    await test.end();
  } finally {
    await admin.end();
  }
  console.log("✔ migrate complete\n");
};

// Resets insurance_db and loads sample data (destructive, but predictable).
const seed = async () => {
  console.log(`\n→ seed: resetting ${DB_NAME} with sample data`);
  const admin = await adminConnection();
  try {
    await resetDatabase(admin, DB_NAME);
    const main = await dbConnection(DB_NAME);
    await runFile(main, SCHEMA_FILE, "schema");
    await runFile(main, SEED_FILE, "sample data (5 customers, 6 policies, payments + reversal)");
    await main.end();
  } finally {
    await admin.end();
  }
  console.log("✔ seed complete\n");
};

// Full reset: main DB gets schema + seed; test DB gets schema + accounts only.
const fresh = async () => {
  console.log(`\n→ fresh: resetting ${DB_NAME} + ${DB_NAME_TEST}`);
  const admin = await adminConnection();
  try {
    await resetDatabase(admin, DB_NAME);
    await resetDatabase(admin, DB_NAME_TEST);

    const main = await dbConnection(DB_NAME);
    await runFile(main, SCHEMA_FILE, "schema");
    await runFile(main, SEED_FILE, "sample data");
    await main.end();

    const test = await dbConnection(DB_NAME_TEST);
    await runFile(test, SCHEMA_FILE, "schema");
    await runFile(test, TEST_FILE, "test accounts");
    await test.end();
  } finally {
    await admin.end();
  }
  console.log("✔ fresh complete\n");
};

const commands = { migrate, seed, fresh };

const [command] = process.argv.slice(2);
if (!command || !commands[command]) {
  console.error("Usage: node scripts/db.js <migrate|seed|fresh>");
  console.error("  migrate — create DBs if missing + apply schema (safe to re-run)");
  console.error("  seed    — reset insurance_db and load sample data");
  console.error("  fresh   — reset both DBs: main gets schema+seed, test gets schema+accounts");
  process.exit(1);
}

commands[command]().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
