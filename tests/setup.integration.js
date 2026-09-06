import { beforeAll, afterAll } from "vitest";
import { resetDatabase, closeConnection } from "./helpers/db.js";

// Route all app SQL to insurance_test for the whole integration run.
// Must be set BEFORE any module imports src/config/db.js.
process.env.DB_USE_TEST = "true";

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeConnection();
});
