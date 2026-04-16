const { env } = require("./config/env");
const { logger } = require("./lib/logger");

if (!env.ENABLE_BACKGROUND_JOBS) {
  logger.info("Background jobs are disabled. Set ENABLE_BACKGROUND_JOBS=true to run the worker.");
  process.exit(0);
}

logger.info("Worker scaffold initialized. Cleanup jobs will be wired in later phases.");
