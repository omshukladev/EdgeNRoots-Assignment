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

const db = createPool(process.env.DB_NAME);
const testDb = createPool(process.env.DB_NAME_TEST);

export { db, testDb, createPool };
