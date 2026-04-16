const { env } = require("./config/env");
const { logger } = require("./lib/logger");
const { startCleanupJob } = require("./jobs/cleanup.job");

if (!env.ENABLE_BACKGROUND_JOBS) {
  logger.info("Background jobs are disabled. Set ENABLE_BACKGROUND_JOBS=true to run the worker.");
  process.exit(0);
}

startCleanupJob();
logger.info("Worker started");
