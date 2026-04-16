const { logger } = require("../../logger");
const { env, isProduction } = require("../../../config/env");

const mockProvider = {
  async sendOtp(payload) {
    if (!isProduction && env.ENABLE_DEV_OTP_LOG) {
      logger.info(
        {
          appId: payload.appId,
          targetType: payload.targetType,
          targetValue: payload.targetValue,
          otp: payload.otp,
        },
        "Mock OTP delivery",
      );
    }

    return {
      channel: "mock",
      provider: "mock",
      accepted: true,
    };
  },
};

module.exports = mockProvider;
