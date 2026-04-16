const { env } = require("../config/env");
const { AppError } = require("../utils/errors");

function adminAuth(req, res, next) {
  const headers = req.validated?.headers || req.headers;
  if (headers["x-internal-admin-key"] !== env.INTERNAL_ADMIN_KEY) {
    return next(
      new AppError({
        statusCode: 403,
        message: "Forbidden",
        errors: [{ code: "ADMIN_AUTH_INVALID" }],
      }),
    );
  }

  return next();
}

module.exports = { adminAuth };
