const test = require('node:test');
const assert = require('node:assert/strict');
const {
  compareOtp,
  generateOpaqueToken,
  generateOtp,
  hashOtp,
  hashToken,
} = require('../../src/utils/crypto');

test('crypto utils generate a 6 digit OTP', () => {
  const otp = generateOtp();
  assert.match(otp, /^\d{6}$/);
});

test('crypto utils hash and verify OTP values', () => {
  const otp = '123456';
  const hash = hashOtp(otp);
  assert.equal(compareOtp(otp, hash), true);
  assert.equal(compareOtp('999999', hash), false);
});

test('crypto utils generate opaque refresh tokens and deterministic hashes', () => {
  const token = generateOpaqueToken();
  assert.ok(token.length > 32);
  assert.equal(hashToken(token), hashToken(token));
});
