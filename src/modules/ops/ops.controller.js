const { prisma } = require('../../lib/prisma');
const appService = require('../apps/app.service');
const identityService = require('../identities/identity.service');
const otpService = require('../otp/otp.service');
const authService = require('../auth/auth.service');
const { successResponse } = require('../../utils/response');

class OpsController {
  async health(req, res) {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json(
      successResponse({
        message: 'Service healthy',
        data: { status: 'ok' },
      }),
    );
  }

  async metrics(req, res) {
    const [apps, identities, otpCodes, activeRefreshTokens] = await Promise.all([
      appService.countApps(),
      identityService.countIdentities(),
      otpService.countOtpCodes(),
      authService.countActiveRefreshTokens(),
    ]);

    res.status(200).json(
      successResponse({
        message: 'Metrics fetched successfully',
        data: {
          apps,
          identities,
          otp_codes: otpCodes,
          active_refresh_tokens: activeRefreshTokens,
        },
      }),
    );
  }
}

module.exports = new OpsController();
