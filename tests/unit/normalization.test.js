const test = require('node:test');
const assert = require('node:assert/strict');
const { maskTarget } = require('../../src/utils/masking');
const { normalizeTarget } = require('../../src/utils/normalization');

test('normalizes email targets', () => {
  assert.equal(normalizeTarget('email', ' USER@Example.com '), 'user@example.com');
});

test('normalizes phone targets', () => {
  assert.equal(normalizeTarget('phone', '+91 98765-43210'), '+919876543210');
});

test('masks email and phone values', () => {
  assert.equal(maskTarget('email', 'user@example.com'), 'u***@example.com');
  assert.match(maskTarget('phone', '+919876543210'), /\*+3210$/);
});
