const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_PATH: z.string().default("/api/v1"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/auth_service?schema=public"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-access-secret-change-me"),
  JWT_ACCESS_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OTP_HASH_SECRET: z.string().min(16).default("dev-otp-secret-change-me"),
  TOKEN_HASH_SECRET: z.string().min(16).default("dev-token-secret-change-me"),
  APP_KEY_SALT_ROUNDS: z.coerce.number().int().positive().default(10),
  INTERNAL_ADMIN_KEY: z.string().min(8).default("dev-admin-key"),
  EMAIL_FROM: z.string().email().default("no-reply@example.com"),
  EMAIL_SMTP_HOST: z.string().min(1).default("localhost"),
  EMAIL_SMTP_PORT: z.coerce.number().int().positive().default(1025),
  EMAIL_SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .default("false")
    .transform((value) => value === true || value === "true"),
  EMAIL_SMTP_USER: z.string().optional().default(""),
  EMAIL_SMTP_PASS: z.string().optional().default(""),
  DEFAULT_EMAIL_PROVIDER: z.string().default("smtp"),
  DEFAULT_DELIVERY_CHANNEL: z.string().default("mock"),
  MSG91_AUTH_KEY: z.string().optional().default(""),
  MSG91_SMS_SENDER_ID: z.string().optional().default(""),
  MSG91_SMS_ROUTE: z.string().default("4"),
  MSG91_SMS_COUNTRY: z.string().default("91"),
  MSG91_SMS_BASE_URL: z.string().url().default("https://api.msg91.com"),
  MSG91_SMS_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  ENABLE_DEV_OTP_LOG: z
    .union([z.boolean(), z.string()])
    .default("true")
    .transform((value) => value === true || value === "true"),
  ENABLE_BACKGROUND_JOBS: z
    .union([z.boolean(), z.string()])
    .default("false")
    .transform((value) => value === true || value === "true"),
  CLEANUP_CRON_SCHEDULE: z.string().default("0 */6 * * *"),
  OTP_RETENTION_HOURS: z.coerce.number().int().positive().default(24),
  REVOKED_TOKEN_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  OPENAPI_OUTPUT_PATH: z.string().default("./openapi.json"),
});

const env = envSchema.parse(process.env);

module.exports = {
  env,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
};
