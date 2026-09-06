import { createLogger, format, transports } from "winston";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const LOG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../logs");

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "warn";
};

const consoleLogFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`),
);

const fileLogFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.json(),
);

const logger = createLogger({
  level: level(),
  levels,
  format: fileLogFormat,
  transports: [
    new transports.Console({ format: consoleLogFormat }),
    new transports.File({ filename: resolve(LOG_DIR, "app.log") }),
    new transports.File({ filename: resolve(LOG_DIR, "error.log"), level: "error" }),
  ],
});

format.colorize().addColors(colors);

logger.morganStream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
