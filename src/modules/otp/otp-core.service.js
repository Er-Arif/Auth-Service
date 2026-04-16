const { generateOtp, hashOtp, compareOtp } = require("../../utils/crypto");
const { addMinutes } = require("../../utils/time");

class OtpCoreService {
  generateOtp() {
    return generateOtp(6);
  }

  hashOtp(value) {
    return hashOtp(value);
  }

  verifyOtp(otp, hash) {
    return compareOtp(otp, hash);
  }

  buildExpiryDate(expiryMinutes) {
    return addMinutes(new Date(), expiryMinutes);
  }

  isExpired(expiresAt) {
    return expiresAt <= new Date();
  }
}

module.exports = new OtpCoreService();
