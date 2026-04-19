const pino = require("pino");
const { env, isDevelopment } = require("../config/env");

const redactPaths = [
  "req.headers.authorization",
  "req.headers.x-app-key",
  "req.headers.x-internal-admin-key",
  "req.body.otp",
  "req.body.refresh_token",
  "res.body.data.refresh_token",
  "otp",
  "appKey",
  "refreshToken",
];

const logger = pino({
  level: isDevelopment ? "debug" : "info",
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: "auth-service",
    env: env.NODE_ENV,
  },
});

module.exports = { logger };
