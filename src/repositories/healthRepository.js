import { db } from "../config/db.js";

const pingDatabase = async () => {
  await db.query("SELECT 1");
  return { db: "connected" };
};

export default { pingDatabase };
