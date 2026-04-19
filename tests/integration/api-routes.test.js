const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../src/app');
const { env } = require('../../src/config/env');
const { AppError } = require('../../src/utils/errors');
const { prisma } = require('../../src/lib/prisma');
const appService = require('../../src/modules/apps/app.service');
const otpService = require('../../src/modules/otp/otp.service');
const authService = require('../../src/modules/auth/auth.service');
const auditService = require('../../src/modules/audit/audit.service');
const { stub } = require('../helpers/stub');

function buildAppContext() {
  return {
    app: {
      appId: 'ride_app',
    },
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

test('GET /api/v1/health returns a success envelope', async (t) => {
  stub(t, prisma, '$queryRaw', async () => [{ ok: 1 }]);

  const response = await request(createApp()).get('/api/v1/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'Service healthy');
  assert.equal(response.body.data.status, 'ok');
});

test('POST /api/v1/otp/send returns contract-shaped success data', async (t) => {
  stub(t, appService, 'validateAppCredentials', async () => buildAppContext());
  stub(t, otpService, 'sendOtp', async () => ({
    target_type: 'email',
    target_value_masked: 'u***@example.com',
    purpose: 'login',
    retry_after_seconds: 60,
    delivery_channel: 'email',
  }));

  const response = await request(createApp())
    .post('/api/v1/otp/send')
    .set('x-app-id', 'ride_app')
    .set('x-app-key', 'ride_app_secret_123')
    .send({
      target_type: 'email',
      target_value: 'user@example.com',
      purpose: 'login',
      device_id: 'device-1',
      metadata: { source: 'integration-test' },
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.delivery_channel, 'email');
});

test('POST /api/v1/otp/send surfaces rate-limit failures cleanly', async (t) => {
  stub(t, appService, 'validateAppCredentials', async () => buildAppContext());
  stub(t, otpService, 'sendOtp', async () => {
    throw new AppError({
      statusCode: 429,
      message: 'Too many OTP requests. Please try again later.',
      errors: [{ code: 'OTP_RATE_LIMIT_EXCEEDED' }],
    });
  });

  const response = await request(createApp())
    .post('/api/v1/otp/send')
    .set('x-app-id', 'ride_app')
    .set('x-app-key', 'ride_app_secret_123')
    .send({
      target_type: 'email',
      target_value: 'user@example.com',
      purpose: 'login',
      device_id: 'device-1',
    });

  assert.equal(response.status, 429);
  assert.equal(response.body.success, false);
  assert.equal(response.body.errors[0].code, 'OTP_RATE_LIMIT_EXCEEDED');
});

test('POST /api/v1/auth/logout-all rejects invalid bearer tokens', async (t) => {
  stub(t, appService, 'validateAppCredentials', async () => buildAppContext());

  const response = await request(createApp())
    .post('/api/v1/auth/logout-all')
    .set('x-app-id', 'ride_app')
    .set('x-app-key', 'ride_app_secret_123')
    .set('authorization', 'Bearer invalid-token')
    .send({
      identity_id: 'd9d6faaf-8eff-46fa-9a8f-5df7444e0b39',
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.errors[0].code, 'ACCESS_TOKEN_INVALID');
});

test('POST /api/v1/auth/logout-all accepts valid tokens and app context', async (t) => {
  const identityId = 'd9d6faaf-8eff-46fa-9a8f-5df7444e0b39';
  stub(t, appService, 'validateAppCredentials', async () => buildAppContext());
  stub(t, authService, 'logoutAll', async () => undefined);

  const accessToken = jwt.sign(
    {
      identity_id: identityId,
      app_id: 'ride_app',
      identity_type: 'email',
      identity_value: 'user@example.com',
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );

  const response = await request(createApp())
    .post('/api/v1/auth/logout-all')
    .set('x-app-id', 'ride_app')
    .set('x-app-key', 'ride_app_secret_123')
    .set('authorization', `Bearer ${accessToken}`)
    .send({
      identity_id: identityId,
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.message, 'Logged out from all devices successfully');
});

test('GET /api/v1/audit-logs returns paginated audit data for admins', async (t) => {
  stub(t, auditService, 'listLogs', async () => ({
    items: [
      {
        id: '1f7ccf20-7a17-4ceb-aa8f-c934da4a3baf',
        app_id: 'ride_app',
        event_type: 'otp.send',
        target_type: 'email',
        target_value: 'user@example.com',
        ip_address: '127.0.0.1',
        device_id: 'device-1',
        status: 'success',
        message: 'OTP sent successfully',
        metadata: { source: 'integration-test' },
        created_at: new Date().toISOString(),
      },
    ],
    page: 1,
    limit: 20,
    total: 1,
  }));

  const response = await request(createApp())
    .get('/api/v1/audit-logs?page=1&limit=20')
    .set('x-internal-admin-key', env.INTERNAL_ADMIN_KEY);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.total, 1);
  assert.equal(response.body.data.items[0].event_type, 'otp.send');
});

test('POST /api/v1/apps returns the generated app key for admin flows', async (t) => {
  stub(t, appService, 'createApp', async () => ({
    id: '3a1f0f76-573e-4a26-99cd-a80cce878eb3',
    app_id: 'demo_app',
    name: 'Demo App',
    status: 'active',
    app_key: 'generated-secret',
  }));

  const response = await request(createApp())
    .post('/api/v1/apps')
    .set('x-internal-admin-key', env.INTERNAL_ADMIN_KEY)
    .send({
      app_id: 'demo_app',
      name: 'Demo App',
      status: 'active',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.app_key, 'generated-secret');
});
