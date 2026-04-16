const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { addDays } = require("../../utils/time");
const { AppError } = require("../../utils/errors");
const { hashToken, generateOpaqueToken } = require("../../utils/crypto");
const authRepository = require("./auth.repository");
const auditService = require("../audit/audit.service");

class AuthService {
  signAccessToken({ identity, appConfig }) {
    const expiresInMinutes = appConfig.accessTokenTtlMinutes || env.JWT_ACCESS_TTL_MINUTES;
    const accessToken = jwt.sign(
      {
        identity_id: identity.id,
        app_id: identity.appId,
        identity_type: identity.identityType,
        identity_value: identity.identityValue,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: `${expiresInMinutes}m`,
      },
    );

    return {
      accessToken,
      expiresIn: expiresInMinutes * 60,
    };
  }

  async issueTokens({ identity, appId, appConfig, deviceId }) {
    const { accessToken, expiresIn } = this.signAccessToken({ identity, appConfig });
    const refreshToken = generateOpaqueToken();
    const tokenHash = hashToken(refreshToken);

    await authRepository.createRefreshToken({
      appId,
      identityId: identity.id,
      tokenHash,
      expiresAt: addDays(new Date(), appConfig.refreshTokenTtlDays),
      deviceId,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: expiresIn,
    };
  }

  async refreshTokens({ appContext, refreshToken, deviceId, ipAddress }) {
    const tokenRecord = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));

    if (
      !tokenRecord ||
      tokenRecord.appId !== appContext.app.appId ||
      tokenRecord.isRevoked ||
      tokenRecord.expiresAt <= new Date()
    ) {
      throw new AppError({
        statusCode: 401,
        message: "Invalid or expired refresh token",
        errors: [{ code: "REFRESH_TOKEN_INVALID" }],
      });
    }

    await authRepository.revokeRefreshToken(tokenRecord.id);

    const tokens = await this.issueTokens({
      identity: tokenRecord.identity,
      appId: appContext.app.appId,
      appConfig: appContext.config,
      deviceId: deviceId || tokenRecord.deviceId,
    });

    await auditService.logEvent({
      appId: appContext.app.appId,
      eventType: "auth.refresh",
      targetType: tokenRecord.identity.identityType,
      targetValue: tokenRecord.identity.identityValue,
      ipAddress,
      deviceId,
      status: "success",
      message: "Token refreshed successfully",
    });

    return tokens;
  }

  async logout({ appContext, refreshToken, deviceId, ipAddress }) {
    const tokenRecord = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));

    if (!tokenRecord || tokenRecord.appId !== appContext.app.appId) {
      throw new AppError({
        statusCode: 401,
        message: "Invalid or expired refresh token",
        errors: [{ code: "REFRESH_TOKEN_INVALID" }],
      });
    }

    if (!tokenRecord.isRevoked) {
      await authRepository.revokeRefreshToken(tokenRecord.id);
    }

    await auditService.logEvent({
      appId: appContext.app.appId,
      eventType: "auth.logout",
      targetType: tokenRecord.identity.identityType,
      targetValue: tokenRecord.identity.identityValue,
      ipAddress,
      deviceId,
      status: "success",
      message: "Logged out successfully",
    });
  }

  async logoutAll({ appContext, auth, identityId, ipAddress }) {
    if (auth.identity_id !== identityId) {
      throw new AppError({
        statusCode: 403,
        message: "Forbidden",
        errors: [{ code: "ACCESS_TOKEN_INVALID" }],
      });
    }

    await authRepository.revokeAllForIdentity(identityId, appContext.app.appId);

    await auditService.logEvent({
      appId: appContext.app.appId,
      eventType: "auth.logout_all",
      targetType: auth.identity_type,
      targetValue: auth.identity_value,
      ipAddress,
      deviceId: null,
      status: "success",
      message: "Logged out from all devices successfully",
    });
  }

  async countActiveRefreshTokens() {
    return authRepository.countActiveRefreshTokens();
  }

  async cleanupExpiredAndRevoked({ expiredBefore, revokedBefore }) {
    const [expired, revoked] = await Promise.all([
      authRepository.deleteExpiredRefreshTokens(expiredBefore),
      authRepository.deleteRevokedRefreshTokens(revokedBefore),
    ]);

    return {
      deletedExpiredTokens: expired.count,
      deletedRevokedTokens: revoked.count,
    };
  }
}

module.exports = new AuthService();
