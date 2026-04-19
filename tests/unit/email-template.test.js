const test = require('node:test');
const assert = require('node:assert/strict');
const { buildOtpEmail } = require('../../src/lib/delivery/email-template');

test('email template builds branded OTP content for login', () => {
  const result = buildOtpEmail({
    otp: '123456',
    purpose: 'login',
    expiryMinutes: 5,
  });

  assert.match(result.subject, /Login OTP - Auth Service/);
  assert.match(result.text, /OTP: 123456/);
  assert.match(result.text, /Expires in: 5 minutes/);
  assert.match(result.html, /One-Time Password/);
  assert.match(result.html, /123456/);
});

test('email template escapes HTML-sensitive OTP values', () => {
  const result = buildOtpEmail({
    otp: '<123>',
    purpose: 'verify_identity',
    expiryMinutes: 10,
  });

  assert.match(result.html, /&lt;123&gt;/);
  assert.doesNotMatch(result.html, /<123>/);
});
