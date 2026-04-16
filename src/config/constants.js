const APP_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

const TARGET_TYPES = {
  EMAIL: "email",
  PHONE: "phone",
};

const OTP_PURPOSES = {
  LOGIN: "login",
  SIGNUP: "signup",
  VERIFY_IDENTITY: "verify_identity",
  RESET: "reset",
};

const DELIVERY_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  MOCK: "mock",
};

const EMAIL_PROVIDERS = {
  SMTP: "smtp",
  RESEND: "resend",
  MOCK: "mock",
};

const SMS_PROVIDERS = {
  MSG91: "msg91",
  FAST2SMS: "fast2sms",
  MOCK: "mock",
};

const DEFAULT_OTP_POLICY = {
  length: 6,
  otpExpiryMinutes: 5,
  resendCooldownSeconds: 60,
  maxAttempts: 5,
  maxRequestsPerHourPerTarget: 5,
  maxRequestsPerHourPerIp: 10,
  maxResendCount: 3,
  accessTokenTtlMinutes: 15,
  refreshTokenTtlDays: 30,
};

module.exports = {
  APP_STATUS,
  TARGET_TYPES,
  OTP_PURPOSES,
  DELIVERY_CHANNELS,
  EMAIL_PROVIDERS,
  SMS_PROVIDERS,
  DEFAULT_OTP_POLICY,
};
