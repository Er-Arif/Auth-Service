const test = require('node:test');
const assert = require('node:assert/strict');
const { otpSendRequestSchema } = require('../../src/schemas/otp');
const { verifyContactRequestSchema } = require('../../src/schemas/identity');

test('schema validation rejects invalid email target values with TARGET_INVALID', () => {
  const result = otpSendRequestSchema.safeParse({
    target_type: 'email',
    target_value: 'not-an-email',
    purpose: 'login',
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, 'TARGET_INVALID');
});

test('schema validation accepts verify_identity requests for valid contacts', () => {
  const result = verifyContactRequestSchema.safeParse({
    target_type: 'phone',
    target_value: '+919876543210',
    purpose: 'verify_identity',
  });

  assert.equal(result.success, true);
});
