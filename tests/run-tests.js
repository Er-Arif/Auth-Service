const assert = require("node:assert/strict");
const { compareOtp, generateOpaqueToken, generateOtp, hashOtp, hashToken } = require("../src/utils/crypto");
const { env } = require("../src/config/env");
const { maskTarget } = require("../src/utils/masking");
const { normalizeTarget } = require("../src/utils/normalization");
const { otpSendRequestSchema } = require("../src/schemas/otp");
const { verifyContactRequestSchema } = require("../src/schemas/identity");
const { registry } = require("../src/openapi/registry");
const appService = require("../src/modules/apps/app.service");
const appRepository = require("../src/modules/apps/app.repository");

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function main() {
await runTest("generateOtp returns a 6 digit string", () => {
  assert.match(generateOtp(), /^\d{6}$/);
});

await runTest("OTP hashing and comparison work", () => {
  const otp = "123456";
  const hash = hashOtp(otp);
  assert.equal(compareOtp(otp, hash), true);
  assert.equal(compareOtp("999999", hash), false);
});

await runTest("refresh token hashing is deterministic", () => {
  const token = generateOpaqueToken();
  assert.ok(token.length > 32);
  assert.equal(hashToken(token), hashToken(token));
});

await runTest("createApp uses configured salt rounds and returns raw app key once", async () => {
  const bcrypt = {
    async hash(value, rounds) {
      assert.equal(rounds, env.APP_KEY_SALT_ROUNDS);
      return `hashed:${value}`;
    },
  };

  const originalCreateApp = appRepository.createApp;
  appRepository.createApp = async ({ appId, name, appKeyHash, status }) => ({
    id: "demo-id",
    appId,
    name,
    appKeyHash,
    status,
  });

  return appService.createApp({ appId: "demo_app", name: "Demo", status: "active", bcrypt }).then((result) => {
    assert.equal(result.app_id, "demo_app");
    assert.equal(result.status, "active");
    assert.ok(result.app_key);
  }).finally(() => {
    appRepository.createApp = originalCreateApp;
  });
});

await runTest("target normalization works", () => {
  assert.equal(normalizeTarget("email", " USER@Example.com "), "user@example.com");
  assert.equal(normalizeTarget("phone", "+91 98765-43210"), "+919876543210");
});

await runTest("target masking works", () => {
  assert.equal(maskTarget("email", "user@example.com"), "u***@example.com");
  assert.match(maskTarget("phone", "+919876543210"), /\*+3210$/);
});

await runTest("invalid email targets map to TARGET_INVALID", () => {
  const result = otpSendRequestSchema.safeParse({
    target_type: "email",
    target_value: "not-an-email",
    purpose: "login",
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, "TARGET_INVALID");
});

await runTest("verify contact schema accepts valid phone input", () => {
  const result = verifyContactRequestSchema.safeParse({
    target_type: "phone",
    target_value: "+919876543210",
    purpose: "verify_identity",
  });

  assert.equal(result.success, true);
});

await runTest("route registry is populated for OpenAPI generation", () => {
  require("../src/routes");
  assert.ok(registry.definitions.length > 0);
});

console.log("All smoke tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
