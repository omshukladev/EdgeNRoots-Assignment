import { db } from "../config/db.js";

const createCustomer = async (name, email, phone) => {
  const [result] = await db.query(
    "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
    [name, email, phone ?? null],
  );
  return findById(result.insertId);
};

const findByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM customers WHERE email = ? LIMIT 1", [email]);
  return rows[0] ?? null;
};

const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM customers WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
};

export default { createCustomer, findByEmail, findById };
