const cron = require("node-cron");
const { env } = require("../config/env");
const { logger } = require("../lib/logger");
const otpService = require("../modules/otp/otp.service");
const authService = require("../modules/auth/auth.service");
const { subtractDays, subtractHours } = require("../utils/time");

async function runCleanupOnce() {
  const expiredOtpBefore = subtractHours(new Date(), env.OTP_RETENTION_HOURS);
  const revokedBefore = subtractDays(new Date(), env.REVOKED_TOKEN_RETENTION_DAYS);

  const [otpCleanup, tokenCleanup] = await Promise.all([
    otpService.cleanupExpiredOtps(expiredOtpBefore),
    authService.cleanupExpiredAndRevoked({
      expiredBefore: new Date(),
      revokedBefore,
    }),
  ]);

  logger.info(
    {
      otpCleanup,
      tokenCleanup,
    },
    "Cleanup job completed",
  );
}

function startCleanupJob() {
  logger.info({ schedule: env.CLEANUP_CRON_SCHEDULE }, "Starting cleanup job scheduler");
  return cron.schedule(env.CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await runCleanupOnce();
    } catch (error) {
      logger.error({ err: error }, "Cleanup job failed");
    }
  });
}

module.exports = {
  runCleanupOnce,
  startCleanupJob,
};
