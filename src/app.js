import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { ApiError, globalLimiter, requestLogger, logError, logger } from "./utils/index.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev", { stream: logger.morganStream }));
}
app.use(globalLimiter);

app.use(healthRoutes);

app.use((req, res) => {
  throw new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`, [], "NOT_FOUND");
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logError(err, req);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: statusCode,
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "Something went wrong",
    errors: err.errors || [],
    success: false,
  });
});

export default app;
