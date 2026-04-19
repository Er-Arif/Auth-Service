const { createApp } = require('./app');
const { env } = require('./config/env');
const { logger } = require('./lib/logger');
const { prisma } = require('./lib/prisma');

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Auth service listening');
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down auth service');

  server.close(async (error) => {
    if (error) {
      logger.error({ err: error }, 'Failed to close HTTP server cleanly');
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      logger.error({ err: disconnectError }, 'Failed to disconnect Prisma cleanly');
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  });
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      logger.error({ err: error, signal }, 'Unexpected shutdown failure');
      process.exit(1);
    });
  });
});

process.on('unhandledRejection', (error) => {
  logger.error({ err: error }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});
