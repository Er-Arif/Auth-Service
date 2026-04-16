const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { DEFAULT_OTP_POLICY, DELIVERY_CHANNELS, EMAIL_PROVIDERS, SMS_PROVIDERS, TARGET_TYPES, APP_STATUS } = require("../src/config/constants");

const prisma = new PrismaClient();

async function upsertApp({ appId, name, rawAppKey, status }) {
  const appKeyHash = await bcrypt.hash(rawAppKey, 10);

  await prisma.app.upsert({
    where: { appId },
    update: {
      name,
      appKeyHash,
      status,
    },
    create: {
      appId,
      name,
      appKeyHash,
      status,
    },
  });

  await prisma.appConfig.upsert({
    where: { appId },
    update: {
      defaultTargetType: TARGET_TYPES.EMAIL,
      otpExpiryMinutes: DEFAULT_OTP_POLICY.otpExpiryMinutes,
      resendCooldownSeconds: DEFAULT_OTP_POLICY.resendCooldownSeconds,
      maxAttempts: DEFAULT_OTP_POLICY.maxAttempts,
      maxRequestsPerHourPerTarget: DEFAULT_OTP_POLICY.maxRequestsPerHourPerTarget,
      maxRequestsPerHourPerIp: DEFAULT_OTP_POLICY.maxRequestsPerHourPerIp,
      maxResendCount: DEFAULT_OTP_POLICY.maxResendCount,
      activeChannel: DELIVERY_CHANNELS.MOCK,
      emailProvider: EMAIL_PROVIDERS.SMTP,
      smsProvider: SMS_PROVIDERS.MOCK,
      accessTokenTtlMinutes: DEFAULT_OTP_POLICY.accessTokenTtlMinutes,
      refreshTokenTtlDays: DEFAULT_OTP_POLICY.refreshTokenTtlDays,
    },
    create: {
      appId,
      defaultTargetType: TARGET_TYPES.EMAIL,
      otpExpiryMinutes: DEFAULT_OTP_POLICY.otpExpiryMinutes,
      resendCooldownSeconds: DEFAULT_OTP_POLICY.resendCooldownSeconds,
      maxAttempts: DEFAULT_OTP_POLICY.maxAttempts,
      maxRequestsPerHourPerTarget: DEFAULT_OTP_POLICY.maxRequestsPerHourPerTarget,
      maxRequestsPerHourPerIp: DEFAULT_OTP_POLICY.maxRequestsPerHourPerIp,
      maxResendCount: DEFAULT_OTP_POLICY.maxResendCount,
      activeChannel: DELIVERY_CHANNELS.MOCK,
      emailProvider: EMAIL_PROVIDERS.SMTP,
      smsProvider: SMS_PROVIDERS.MOCK,
      accessTokenTtlMinutes: DEFAULT_OTP_POLICY.accessTokenTtlMinutes,
      refreshTokenTtlDays: DEFAULT_OTP_POLICY.refreshTokenTtlDays,
    },
  });
}

async function main() {
  await upsertApp({
    appId: "ride_app",
    name: "Ride Booking App",
    rawAppKey: "ride_app_secret_123",
    status: APP_STATUS.ACTIVE,
  });

  await upsertApp({
    appId: "social_app",
    name: "Social App",
    rawAppKey: "social_app_secret_123",
    status: APP_STATUS.INACTIVE,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
