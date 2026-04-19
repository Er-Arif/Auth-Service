const test = require('node:test');
const assert = require('node:assert/strict');
const authService = require('../../src/modules/auth/auth.service');
const authRepository = require('../../src/modules/auth/auth.repository');
const auditService = require('../../src/modules/audit/audit.service');
const { AppError } = require('../../src/utils/errors');
const { stub } = require('../helpers/stub');

test('auth service rejects invalid refresh tokens', async (t) => {
  stub(t, authRepository, 'findRefreshTokenByHash', async () => null);

  await assert.rejects(
    authService.refreshTokens({
      appContext: {
        app: { appId: 'ride_app' },
        config: { refreshTokenTtlDays: 30, accessTokenTtlMinutes: 15 },
      },
      refreshToken: 'bad-token',
      deviceId: 'device-1',
      ipAddress: '127.0.0.1',
    }),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 401 &&
      error.errors[0].code === 'REFRESH_TOKEN_INVALID',
  );
});

test('auth service prevents logout-all for mismatched identities', async () => {
  await assert.rejects(
    authService.logoutAll({
      appContext: {
        app: { appId: 'ride_app' },
      },
      auth: {
        identity_id: 'identity-a',
        identity_type: 'email',
        identity_value: 'user@example.com',
      },
      identityId: 'identity-b',
      ipAddress: '127.0.0.1',
    }),
    (error) =>
      error instanceof AppError &&
      error.statusCode === 403 &&
      error.errors[0].code === 'ACCESS_TOKEN_INVALID',
  );
});

test('auth service refresh rotates tokens and writes an audit log', async (t) => {
  const revoked = [];
  const issued = [];
  const auditEvents = [];

  stub(t, authRepository, 'findRefreshTokenByHash', async () => ({
    id: 'refresh-token-id',
    appId: 'ride_app',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 60_000),
    deviceId: 'device-1',
    identity: {
      id: 'f952d302-610f-46d8-904b-2b8e93fd70f0',
      appId: 'ride_app',
      identityType: 'email',
      identityValue: 'user@example.com',
    },
  }));
  stub(t, authRepository, 'revokeRefreshToken', async (id) => {
    revoked.push(id);
  });
  stub(t, authRepository, 'createRefreshToken', async (data) => {
    issued.push(data);
    return data;
  });
  stub(t, auditService, 'logEvent', async (event) => {
    auditEvents.push(event);
  });

  const result = await authService.refreshTokens({
    appContext: {
      app: { appId: 'ride_app' },
      config: { refreshTokenTtlDays: 30, accessTokenTtlMinutes: 15 },
    },
    refreshToken: 'valid-refresh-token',
    deviceId: 'device-1',
    ipAddress: '127.0.0.1',
  });

  assert.equal(revoked[0], 'refresh-token-id');
  assert.equal(issued.length, 1);
  assert.equal(auditEvents[0].eventType, 'auth.refresh');
  assert.equal(result.token_type, 'Bearer');
  assert.ok(result.access_token);
  assert.ok(result.refresh_token);
});
