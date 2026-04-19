const { AppError } = require('../../utils/errors');
const { normalizeTarget } = require('../../utils/normalization');
const { maskTarget } = require('../../utils/masking');
const { sendOtp: deliverOtp } = require('../../lib/delivery/delivery-manager');
const { buildOtpEmail } = require('../../lib/delivery/email-template');
const otpRepository = require('./otp.repository');
const otpCoreService = require('./otp-core.service');
const auditService = require('../audit/audit.service');
const identityService = require('../identities/identity.service');
const authService = require('../auth/auth.service');

class OtpService {
  async enforceRateLimits({ appContext, targetType, targetValue, ipAddress }) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [targetCount, ipCount] = await Promise.all([
      otpRepository.countRecentByTarget({
        appId: appContext.app.appId,
        targetType,
        targetValue,
        since,
      }),
      otpRepository.countRecentByIp({
        appId: appContext.app.appId,
        ipAddress,
        since,
      }),
    ]);

    if (
      targetCount >= appContext.config.maxRequestsPerHourPerTarget ||
      ipCount >= appContext.config.maxRequestsPerHourPerIp
    ) {
      throw new AppError({
        statusCode: 429,
        message: 'Too many OTP requests. Please try again later.',
        errors: [{ code: 'OTP_RATE_LIMIT_EXCEEDED' }],
      });
    }
  }

  ensureCooldown(latestOtp, cooldownSeconds) {
    if (!latestOtp) {
      return;
    }

    const availableAt = latestOtp.createdAt.getTime() + cooldownSeconds * 1000;
    if (availableAt > Date.now()) {
      throw new AppError({
        statusCode: 429,
        message: 'Please wait before requesting another OTP',
        errors: [{ field: 'target_value', code: 'OTP_COOLDOWN_ACTIVE' }],
      });
    }
  }

  buildDeliveryPayload({ appId, targetType, targetValue, otp, purpose, expiryMinutes }) {
    const emailContent = buildOtpEmail({
      otp,
      purpose,
      expiryMinutes,
    });

    return {
      appId,
      targetType,
      targetValue,
      otp,
      subject: emailContent.subject,
      message: emailContent.text,
      html: emailContent.html,
      templateData: {
        otp,
        purpose,
        expiry_minutes: expiryMinutes,
      },
    };
  }

  async sendOtp({ appContext, body, ipAddress }) {
    const targetValue = normalizeTarget(body.target_type, body.target_value);
    const latestOtp = await otpRepository.findLatestOtp({
      appId: appContext.app.appId,
      targetType: body.target_type,
      targetValue,
      purpose: body.purpose,
    });

    await this.enforceRateLimits({
      appContext,
      targetType: body.target_type,
      targetValue,
      ipAddress,
    });

    if (latestOtp && !otpCoreService.isExpired(latestOtp.expiresAt)) {
      this.ensureCooldown(latestOtp, appContext.config.resendCooldownSeconds);
    }

    const otp = otpCoreService.generateOtp();
    const otpRecord = await otpRepository.createOtp({
      appId: appContext.app.appId,
      targetType: body.target_type,
      targetValue,
      purpose: body.purpose,
      otpHash: otpCoreService.hashOtp(otp),
      expiresAt: otpCoreService.buildExpiryDate(appContext.config.otpExpiryMinutes),
      maxAttempts: appContext.config.maxAttempts,
      resendCount: 0,
      ipAddress,
      deviceId: body.device_id,
    });

    let deliveryResult;

    try {
      deliveryResult = await deliverOtp({
        appConfig: appContext.config,
        payload: this.buildDeliveryPayload({
          appId: appContext.app.appId,
          targetType: body.target_type,
          targetValue,
          otp,
          purpose: body.purpose,
          expiryMinutes: appContext.config.otpExpiryMinutes,
        }),
      });
    } catch (error) {
      await otpRepository.deleteOtp(otpRecord.id).catch(() => null);
      throw error;
    }

    await auditService.logEvent({
      appId: appContext.app.appId,
      eventType: 'otp.send',
      targetType: body.target_type,
      targetValue,
      ipAddress,
      deviceId: body.device_id,
      status: 'success',
      message: 'OTP sent successfully',
      metadataJson: body.metadata || null,
    });

    return {
      target_type: body.target_type,
      target_value_masked: maskTarget(body.target_type, targetValue),
      purpose: body.purpose,
      retry_after_seconds: appContext.config.resendCooldownSeconds,
      delivery_channel: deliveryResult.channel,
    };
  }

  async resendOtp({ appContext, body, ipAddress }) {
    const targetValue = normalizeTarget(body.target_type, body.target_value);
    const latestOtp = await otpRepository.findLatestOtp({
      appId: appContext.app.appId,
      targetType: body.target_type,
      targetValue,
      purpose: body.purpose,
    });

    await this.enforceRateLimits({
      appContext,
      targetType: body.target_type,
      targetValue,
      ipAddress,
    });

    if (!latestOtp || otpCoreService.isExpired(latestOtp.expiresAt)) {
      throw new AppError({
        statusCode: 404,
        message: 'OTP not found',
        errors: [{ code: 'OTP_NOT_FOUND' }],
      });
    }

    this.ensureCooldown(latestOtp, appContext.config.resendCooldownSeconds);

    if (latestOtp.resendCount >= appContext.config.maxResendCount) {
      throw new AppError({
        statusCode: 429,
        message: 'Maximum resend attempts reached',
        errors: [{ code: 'OTP_RESEND_LIMIT_EXCEEDED' }],
      });
    }

    const otp = otpCoreService.generateOtp();
    const otpRecord = await otpRepository.createOtp({
      appId: appContext.app.appId,
      targetType: body.target_type,
      targetValue,
      purpose: body.purpose,
      otpHash: otpCoreService.hashOtp(otp),
      expiresAt: otpCoreService.buildExpiryDate(appContext.config.otpExpiryMinutes),
      maxAttempts: appContext.config.maxAttempts,
      resendCount: latestOtp.resendCount + 1,
      ipAddress,
      deviceId: body.device_id,
    });

    try {
      await deliverOtp({
        appConfig: appContext.config,
        payload: this.buildDeliveryPayload({
          appId: appContext.app.appId,
          targetType: body.target_type,
          targetValue,
          otp,
          purpose: body.purpose,
          expiryMinutes: appContext.config.otpExpiryMinutes,
        }),
      });
    } catch (error) {
      await otpRepository.deleteOtp(otpRecord.id).catch(() => null);
      throw error;
    }

    await auditService.logEvent({
      appId: appContext.app.appId,
      eventType: 'otp.resend',
      targetType: body.target_type,
      targetValue,
      ipAddress,
      deviceId: body.device_id,
      status: 'success',
      message: 'OTP resent successfully',
    });

    return {
      retry_after_seconds: appContext.config.resendCooldownSeconds,
    };
  }

  async verifyOtp({ appContext, body, ipAddress }) {
    const targetValue = normalizeTarget(body.target_type, body.target_value);
    const latestOtp = await otpRepository.findLatestOtp({
      appId: appContext.app.appId,
      targetType: body.target_type,
      targetValue,
      purpose: body.purpose,
    });

    if (!latestOtp) {
      throw new AppError({
        statusCode: 404,
        message: 'OTP not found',
        errors: [{ code: 'OTP_NOT_FOUND' }],
      });
    }

    if (otpCoreService.isExpired(latestOtp.expiresAt)) {
      throw new AppError({
        statusCode: 422,
        message: 'OTP has expired',
        errors: [{ field: 'otp', code: 'OTP_EXPIRED' }],
      });
    }

    if (latestOtp.attempts >= latestOtp.maxAttempts) {
      throw new AppError({
        statusCode: 422,
        message: 'Maximum OTP attempts exceeded',
        errors: [{ field: 'otp', code: 'OTP_MAX_ATTEMPTS_EXCEEDED' }],
      });
    }

    const updatedOtp = await otpRepository.incrementAttempts(latestOtp.id);
    const isValid = otpCoreService.verifyOtp(body.otp, latestOtp.otpHash);

    if (!isValid) {
      await auditService.logEvent({
        appId: appContext.app.appId,
        eventType: 'otp.verify',
        targetType: body.target_type,
        targetValue,
        ipAddress,
        deviceId: body.device_id,
        status: 'failed',
        message: 'Invalid OTP',
      });

      if (updatedOtp.attempts >= updatedOtp.maxAttempts) {
        throw new AppError({
          statusCode: 422,
          message: 'Maximum OTP attempts exceeded',
          errors: [{ field: 'otp', code: 'OTP_MAX_ATTEMPTS_EXCEEDED' }],
        });
      }

      throw new AppError({
        statusCode: 422,
        message: 'Invalid OTP',
        errors: [{ field: 'otp', code: 'OTP_INVALID' }],
      });
    }

    await otpRepository.markUsed(latestOtp.id);

    const identity = await identityService.createOrVerifyIdentity({
      appId: appContext.app.appId,
      identityType: body.target_type,
      identityValue: targetValue,
      metadata: body.metadata || {},
    });

    const tokens = await authService.issueTokens({
      identity,
      appId: appContext.app.appId,
      appConfig: appContext.config,
      deviceId: body.device_id,
    });

    await auditService.logEvent({
      appId: appContext.app.appId,
      eventType: 'otp.verify',
      targetType: body.target_type,
      targetValue,
      ipAddress,
      deviceId: body.device_id,
      status: 'success',
      message: 'OTP verified successfully',
    });

    return {
      identity: {
        id: identity.id,
        app_id: identity.appId,
        identity_type: identity.identityType,
        identity_value: identity.identityValue,
        is_verified: identity.isVerified,
      },
      ...tokens,
    };
  }

  async cleanupExpiredOtps(before) {
    const result = await otpRepository.deleteExpiredOtps(before);
    return {
      deletedOtps: result.count,
    };
  }

  async countOtpCodes() {
    return otpRepository.countOtpCodes();
  }
}

module.exports = new OtpService();
