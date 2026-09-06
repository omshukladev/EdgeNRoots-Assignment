import "dotenv/config";

const REQUIRED = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_NAME_TEST",
];

const loadEnv = () => {
  const missing = REQUIRED.filter((key) => process.env[key] === undefined || process.env[key] === "");
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill them in.`,
    );
  }
  return {
    port: Number(process.env.PORT) || 3000,
    db: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      testDatabase: process.env.DB_NAME_TEST,
    },
  };
};

export { loadEnv };
