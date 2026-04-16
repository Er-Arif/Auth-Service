const { AppError } = require("../../../utils/errors");

const resendProvider = {
  async sendOtp() {
    throw new AppError({
      statusCode: 503,
      message: "Delivery provider unavailable",
      errors: [{ code: "DELIVERY_PROVIDER_UNAVAILABLE" }],
    });
  },
};

module.exports = resendProvider;
