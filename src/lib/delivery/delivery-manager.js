const { AppError } = require("../../utils/errors");
const mockProvider = require("./providers/mock.provider");
const smtpProvider = require("./providers/smtp.provider");
const resendProvider = require("./providers/resend.provider");
const smsProvider = require("./providers/sms.provider");

const emailProviders = {
  smtp: smtpProvider,
  resend: resendProvider,
  mock: mockProvider,
};

const smsProviders = {
  mock: mockProvider,
  msg91: smsProvider,
  fast2sms: smsProvider,
};

async function sendOtp({ appConfig, payload }) {
  if (appConfig.activeChannel === "mock") {
    return mockProvider.sendOtp(payload);
  }

  if (appConfig.activeChannel === "email") {
    if (payload.targetType !== "email") {
      throw new AppError({
        statusCode: 503,
        message: "Delivery provider unavailable",
        errors: [{ code: "DELIVERY_PROVIDER_UNAVAILABLE" }],
      });
    }

    const provider = emailProviders[appConfig.emailProvider];
    if (!provider) {
      throw new AppError({
        statusCode: 503,
        message: "Delivery provider unavailable",
        errors: [{ code: "DELIVERY_PROVIDER_UNAVAILABLE" }],
      });
    }

    return provider.sendOtp(payload);
  }

  if (appConfig.activeChannel === "sms") {
    if (payload.targetType !== "phone") {
      throw new AppError({
        statusCode: 503,
        message: "Delivery provider unavailable",
        errors: [{ code: "DELIVERY_PROVIDER_UNAVAILABLE" }],
      });
    }

    const provider = smsProviders[appConfig.smsProvider];
    if (!provider) {
      throw new AppError({
        statusCode: 503,
        message: "Delivery provider unavailable",
        errors: [{ code: "DELIVERY_PROVIDER_UNAVAILABLE" }],
      });
    }

    return provider.sendOtp(payload);
  }

  throw new AppError({
    statusCode: 503,
    message: "Delivery provider unavailable",
    errors: [{ code: "DELIVERY_PROVIDER_UNAVAILABLE" }],
  });
}

module.exports = { sendOtp };
