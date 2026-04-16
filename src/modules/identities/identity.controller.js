const otpService = require("../otp/otp.service");
const identityService = require("./identity.service");
const { successResponse } = require("../../utils/response");

class IdentityController {
  async getMe(req, res) {
    const identity = await identityService.getCurrentIdentity(req.auth);
    res.status(200).json(
      successResponse({
        message: "Identity fetched successfully",
        data: identity,
      }),
    );
  }

  async verifyContact(req, res) {
    const result = await otpService.sendOtp({
      appContext: req.appContext,
      body: {
        ...req.validated.body,
        device_id: undefined,
        metadata: {
          source: "verify_contact",
          identity_id: req.auth.identity_id,
        },
      },
      ipAddress: req.context.ipAddress,
    });

    res.status(200).json(
      successResponse({
        message: "OTP sent successfully",
        data: result,
      }),
    );
  }

  async getIdentityById(req, res) {
    const identity = await identityService.getIdentityByIdAndApp(
      req.validated.params.identityId,
      req.appContext.app.appId,
    );

    res.status(200).json(
      successResponse({
        message: "Identity fetched successfully",
        data: identity,
      }),
    );
  }
}

module.exports = new IdentityController();
