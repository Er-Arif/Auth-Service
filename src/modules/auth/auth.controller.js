const authService = require("./auth.service");
const { successResponse } = require("../../utils/response");

class AuthController {
  async refresh(req, res) {
    const result = await authService.refreshTokens({
      appContext: req.appContext,
      refreshToken: req.validated.body.refresh_token,
      deviceId: req.validated.body.device_id,
      ipAddress: req.context.ipAddress,
    });

    res.status(200).json(
      successResponse({
        message: "Token refreshed successfully",
        data: result,
      }),
    );
  }

  async logout(req, res) {
    await authService.logout({
      appContext: req.appContext,
      refreshToken: req.validated.body.refresh_token,
      deviceId: req.validated.body.device_id,
      ipAddress: req.context.ipAddress,
    });

    res.status(200).json(
      successResponse({
        message: "Logged out successfully",
        data: {},
      }),
    );
  }

  async logoutAll(req, res) {
    await authService.logoutAll({
      appContext: req.appContext,
      auth: req.auth,
      identityId: req.validated.body.identity_id,
      ipAddress: req.context.ipAddress,
    });

    res.status(200).json(
      successResponse({
        message: "Logged out from all devices successfully",
        data: {},
      }),
    );
  }
}

module.exports = new AuthController();
