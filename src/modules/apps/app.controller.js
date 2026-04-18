const bcrypt = require("bcryptjs");
const appService = require("./app.service");
const { successResponse } = require("../../utils/response");

class AppController {
  async createApp(req, res) {
    const result = await appService.createApp({
      appId: req.validated.body.app_id,
      name: req.validated.body.name,
      status: req.validated.body.status,
      bcrypt,
    });
    res.status(201).json(
      successResponse({
        message: "App created successfully",
        data: result,
      }),
    );
  }

  async getApp(req, res) {
    const result = await appService.getApp(req.validated.params.appId);
    res.status(200).json(
      successResponse({
        message: "App fetched successfully",
        data: result,
      }),
    );
  }

  async updateApp(req, res) {
    const result = await appService.updateApp(req.validated.params.appId, req.validated.body);
    res.status(200).json(
      successResponse({
        message: "App updated successfully",
        data: result,
      }),
    );
  }

  async updateAppConfig(req, res) {
    const result = await appService.updateConfig(req.validated.params.appId, req.validated.body);
    res.status(200).json(
      successResponse({
        message: "App config updated successfully",
        data: result,
      }),
    );
  }
}

module.exports = new AppController();
