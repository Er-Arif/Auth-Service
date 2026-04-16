const crypto = require("crypto");
const { env } = require("../config/env");

function hashWithSecret(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function compareHashedValue(value, hash, secret) {
  const expected = hashWithSecret(value, secret);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(hash);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function hashOtp(otp) {
  return hashWithSecret(otp, env.OTP_HASH_SECRET);
}

function compareOtp(otp, hash) {
  return compareHashedValue(otp, hash, env.OTP_HASH_SECRET);
}

function hashToken(token) {
  return hashWithSecret(token, env.TOKEN_HASH_SECRET);
}

function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max + 1));
}

function generateOpaqueToken(byteLength = 48) {
  return crypto.randomBytes(byteLength).toString("hex");
}

module.exports = {
  hashOtp,
  compareOtp,
  hashToken,
  generateOtp,
  generateOpaqueToken,
};
