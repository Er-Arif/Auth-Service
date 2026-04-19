const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../../src/utils/errors');

function loadOtpServiceWithMocks(t, overrides = {}) {
  const otpServicePath = require.resolve('../../src/modules/otp/otp.service');
  const dependencyMap = {
    otpRepository: require.resolve('../../src/modules/otp/otp.repository'),
    deliveryManager: require.resolve('../../src/lib/delivery/delivery-manager'),
    auditService: require.resolve('../../src/modules/audit/audit.service'),
    identityService: require.resolve('../../src/modules/identities/identity.service'),
    authService: require.resolve('../../src/modules/auth/auth.service'),
  };

  const originals = {};
  Object.entries(dependencyMap).forEach(([key, modulePath]) => {
    originals[key] = require(modulePath);
    require.cache[modulePath].exports = overrides[key] || originals[key];
  });

  delete require.cache[otpServicePath];
  const otpService = require(otpServicePath);

  t.after(() => {
    delete require.cache[otpServicePath];
    Object.entries(dependencyMap).forEach(([key, modulePath]) => {
      require.cache[modulePath].exports = originals[key];
    });
  });

  return otpService;
}

function buildAppContext() {
  return {
    app: { appId: 'ride_app' },
    config: {
      otpExpiryMinutes: 5,
      resendCooldownSeconds: 60,
      maxAttempts: 5,
      maxRequestsPerHourPerTarget: 5,
      maxRequestsPerHourPerIp: 10,
      maxResendCount: 3,
      activeChannel: 'email',
      emailProvider: 'smtp',
      smsProvider: 'mock',
      accessTokenTtlMinutes: 15,
      refreshTokenTtlDays: 30,
    },
  };
}

test('otp service removes a just-created OTP when delivery fails', async (t) => {
  const calls = [];
  const otpService = loadOtpServiceWithMocks(t, {
    otpRepository: {
      async findLatestOtp() {
        return null;
      },
      async countRecentByTarget() {
        return 0;
      },
      async countRecentByIp() {
        return 0;
      },
      async createOtp() {
        calls.push('create');
        return { id: 'otp-1' };
      },
      async deleteOtp(id) {
        calls.push(`delete:${id}`);
      },
    },
    deliveryManager: {
      async sendOtp() {
        throw new AppError({
          statusCode: 502,
          message: 'Delivery failed',
          errors: [{ code: 'DELIVERY_FAILED' }],
        });
      },
    },
  });

  await assert.rejects(
    otpService.sendOtp({
      appContext: buildAppContext(),
      body: {
        target_type: 'email',
        target_value: 'user@example.com',
        purpose: 'login',
        device_id: 'device-1',
        metadata: {},
      },
      ipAddress: '127.0.0.1',
    }),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 502 &&
      error.errors[0].code === 'DELIVERY_FAILED',
  );

  assert.deepEqual(calls, ['create', 'delete:otp-1']);
});

test('otp service applies hourly rate limits to resend attempts', async (t) => {
  const otpService = loadOtpServiceWithMocks(t, {
    otpRepository: {
      async findLatestOtp() {
        return {
          id: 'otp-1',
          expiresAt: new Date(Date.now() + 60_000),
          createdAt: new Date(Date.now() - 120_000),
          resendCount: 0,
        };
      },
      async countRecentByTarget() {
        return 5;
      },
      async countRecentByIp() {
        return 0;
      },
    },
  });

  await assert.rejects(
    otpService.resendOtp({
      appContext: buildAppContext(),
      body: {
        target_type: 'email',
        target_value: 'user@example.com',
        purpose: 'login',
        device_id: 'device-1',
      },
      ipAddress: '127.0.0.1',
    }),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 429 &&
      error.errors[0].code === 'OTP_RATE_LIMIT_EXCEEDED',
  );
});
