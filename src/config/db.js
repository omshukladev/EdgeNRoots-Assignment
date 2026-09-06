import mysql from "mysql2/promise";

const createPool = (database) =>
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    timezone: "Z",
  });

// Integration tests set DB_USE_TEST=true (see tests/setup.integration.js)
// so the app's repositories run against insurance_test.
const USE_TEST_DB = process.env.DB_USE_TEST === "true";

const db = createPool(USE_TEST_DB ? process.env.DB_NAME_TEST : process.env.DB_NAME);
const testDb = createPool(process.env.DB_NAME_TEST);

export { db, testDb, createPool };
