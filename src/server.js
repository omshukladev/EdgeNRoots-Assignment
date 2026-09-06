import "dotenv/config";
import app from "./app.js";
import { loadEnv, logger } from "./utils/index.js";

const { port } = loadEnv();

app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});
