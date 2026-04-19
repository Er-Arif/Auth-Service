const { env } = require('./config/env');
const { logger } = require('./lib/logger');
const { prisma } = require('./lib/prisma');
const { startCleanupJob } = require('./jobs/cleanup.job');

if (!env.ENABLE_BACKGROUND_JOBS) {
  logger.info('Background jobs are disabled. Set ENABLE_BACKGROUND_JOBS=true to run the worker.');
  process.exit(0);
}

const task = startCleanupJob();
logger.info('Worker started');

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down worker');

  try {
    task.stop();
    task.destroy();
    await prisma.$disconnect();
  } catch (error) {
    logger.error({ err: error }, 'Worker shutdown failed');
    process.exit(1);
  }

  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      logger.error({ err: error, signal }, 'Unexpected worker shutdown failure');
      process.exit(1);
    });
  });
});

process.on('unhandledRejection', (error) => {
  logger.error({ err: error }, 'Unhandled promise rejection in worker');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception in worker');
  process.exit(1);
});
