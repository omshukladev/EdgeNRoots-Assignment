import logger from "./logger.js";

const requestLogger = (req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
};

const logError = (err, req) => {
  logger.error(
    `Error: ${err.message} - Path: ${req?.path ?? "unknown"} - Method: ${req?.method ?? "unknown"} - IP: ${req?.ip ?? "unknown"}`,
  );
  if (err.stack) {
    logger.debug(`Stack: ${err.stack}`);
  }
};

export { requestLogger, logError };
