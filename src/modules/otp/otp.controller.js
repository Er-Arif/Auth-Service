const otpService = require("./otp.service");
const { successResponse } = require("../../utils/response");

class OtpController {
  async sendOtp(req, res) {
    const result = await otpService.sendOtp({
      appContext: req.appContext,
      body: req.validated.body,
      ipAddress: req.context.ipAddress,
    });

    res.status(200).json(
      successResponse({
        message: "OTP sent successfully",
        data: result,
      }),
    );
  }

  async verifyOtp(req, res) {
    const result = await otpService.verifyOtp({
      appContext: req.appContext,
      body: req.validated.body,
      ipAddress: req.context.ipAddress,
    });

    res.status(200).json(
      successResponse({
        message: "OTP verified successfully",
        data: result,
      }),
    );
  }

  async resendOtp(req, res) {
    const result = await otpService.resendOtp({
      appContext: req.appContext,
      body: req.validated.body,
      ipAddress: req.context.ipAddress,
    });

    res.status(200).json(
      successResponse({
        message: "OTP resent successfully",
        data: result,
      }),
    );
  }
}

module.exports = new OtpController();
