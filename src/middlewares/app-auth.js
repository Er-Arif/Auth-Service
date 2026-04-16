const bcrypt = require("bcryptjs");
const appService = require("../modules/apps/app.service");

async function appAuth(req, res, next) {
  try {
    const headers = req.validated?.headers || req.headers;
    req.appContext = await appService.validateAppCredentials({
      appId: headers["x-app-id"],
      appKey: headers["x-app-key"],
      bcrypt,
    });
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { appAuth };
