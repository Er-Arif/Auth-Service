const crypto = require('crypto');
const { env } = require('../../config/env');
const { AppError } = require('../../utils/errors');
const {
  DEFAULT_OTP_POLICY,
  TARGET_TYPES,
  DELIVERY_CHANNELS,
  SMS_PROVIDERS,
} = require('../../config/constants');
const appRepository = require('./app.repository');

function mapAppWithConfig(app) {
  return {
    id: app.id,
    app_id: app.appId,
    name: app.name,
    status: app.status,
    config: app.config
      ? {
          default_target_type: app.config.defaultTargetType,
          otp_expiry_minutes: app.config.otpExpiryMinutes,
          resend_cooldown_seconds: app.config.resendCooldownSeconds,
          max_attempts: app.config.maxAttempts,
          max_requests_per_hour_per_target: app.config.maxRequestsPerHourPerTarget,
          max_requests_per_hour_per_ip: app.config.maxRequestsPerHourPerIp,
          max_resend_count: app.config.maxResendCount,
          active_channel: app.config.activeChannel,
          email_provider: app.config.emailProvider,
          sms_provider: app.config.smsProvider,
          access_token_ttl_minutes: app.config.accessTokenTtlMinutes,
          refresh_token_ttl_days: app.config.refreshTokenTtlDays,
        }
      : undefined,
  };
}

class AppService {
  defaultConfig() {
    return {
      defaultTargetType: TARGET_TYPES.EMAIL,
      otpExpiryMinutes: DEFAULT_OTP_POLICY.otpExpiryMinutes,
      resendCooldownSeconds: DEFAULT_OTP_POLICY.resendCooldownSeconds,
      maxAttempts: DEFAULT_OTP_POLICY.maxAttempts,
      maxRequestsPerHourPerTarget: DEFAULT_OTP_POLICY.maxRequestsPerHourPerTarget,
      maxRequestsPerHourPerIp: DEFAULT_OTP_POLICY.maxRequestsPerHourPerIp,
      maxResendCount: DEFAULT_OTP_POLICY.maxResendCount,
      activeChannel: env.DEFAULT_DELIVERY_CHANNEL,
      emailProvider: env.DEFAULT_EMAIL_PROVIDER,
      smsProvider:
        env.DEFAULT_DELIVERY_CHANNEL === DELIVERY_CHANNELS.SMS
          ? SMS_PROVIDERS.MSG91
          : SMS_PROVIDERS.MOCK,
      accessTokenTtlMinutes: DEFAULT_OTP_POLICY.accessTokenTtlMinutes,
      refreshTokenTtlDays: DEFAULT_OTP_POLICY.refreshTokenTtlDays,
    };
  }

  async validateAppCredentials({ appId, appKey, bcrypt }) {
    const app = await appRepository.findByAppId(appId);
    if (!app) {
      throw new AppError({
        statusCode: 401,
        message: 'Invalid application credentials',
        errors: [{ code: 'APP_AUTH_INVALID' }],
      });
    }

    const isValidKey = await bcrypt.compare(appKey, app.appKeyHash);
    if (!isValidKey) {
      throw new AppError({
        statusCode: 401,
        message: 'Invalid application credentials',
        errors: [{ code: 'APP_AUTH_INVALID' }],
      });
    }

    if (app.status !== 'active') {
      throw new AppError({
        statusCode: 403,
        message: 'Application is inactive',
        errors: [{ code: 'APP_INACTIVE' }],
      });
    }

    if (!app.config) {
      throw new AppError({
        statusCode: 403,
        message: 'Application configuration missing',
        errors: [{ code: 'APP_CONFIG_MISSING' }],
      });
    }

    return { app, config: app.config };
  }

  async createApp({ appId, name, status, bcrypt }) {
    const existingApp = await appRepository.findByAppId(appId);
    if (existingApp) {
      throw new AppError({
        statusCode: 409,
        message: 'Application already exists',
        errors: [{ code: 'APP_ALREADY_EXISTS' }],
      });
    }

    const rawAppKey = crypto.randomBytes(24).toString('hex');
    const appKeyHash = await bcrypt.hash(rawAppKey, env.APP_KEY_SALT_ROUNDS);
    const app = await appRepository.createApp({
      appId,
      name,
      appKeyHash,
      status,
      config: this.defaultConfig(),
    });

    return {
      id: app.id,
      app_id: app.appId,
      name: app.name,
      status: app.status,
      app_key: rawAppKey,
    };
  }

  async getApp(appId) {
    const app = await appRepository.findByAppId(appId);
    if (!app) {
      throw new AppError({
        statusCode: 404,
        message: 'Application not found',
        errors: [{ code: 'APP_NOT_FOUND' }],
      });
    }

    return mapAppWithConfig(app);
  }

  async updateApp(appId, data) {
    await this.getApp(appId);
    const app = await appRepository.updateApp(appId, {
      name: data.name,
      status: data.status,
    });

    return mapAppWithConfig(app);
  }

  async updateConfig(appId, data) {
    await this.getApp(appId);
    await appRepository.updateConfig(appId, {
      defaultTargetType: data.default_target_type,
      otpExpiryMinutes: data.otp_expiry_minutes,
      resendCooldownSeconds: data.resend_cooldown_seconds,
      maxAttempts: data.max_attempts,
      maxRequestsPerHourPerTarget: data.max_requests_per_hour_per_target,
      maxRequestsPerHourPerIp: data.max_requests_per_hour_per_ip,
      maxResendCount: data.max_resend_count,
      activeChannel: data.active_channel,
      emailProvider: data.email_provider,
      smsProvider: data.sms_provider,
      accessTokenTtlMinutes: data.access_token_ttl_minutes,
      refreshTokenTtlDays: data.refresh_token_ttl_days,
    });

    return this.getApp(appId);
  }

  async countApps() {
    return appRepository.countApps();
  }
}

module.exports = new AppService();
