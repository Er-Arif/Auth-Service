const { AppError } = require("../utils/errors");

function validate({ body, params, query, headers }) {
  return (req, res, next) => {
    try {
      if (body) {
        req.validated = req.validated || {};
        req.validated.body = body.parse(req.body);
      }

      if (params) {
        req.validated = req.validated || {};
        req.validated.params = params.parse(req.params);
      }

      if (query) {
        req.validated = req.validated || {};
        req.validated.query = query.parse(req.query);
      }

      if (headers) {
        req.validated = req.validated || {};
        req.validated.headers = headers.parse(req.headers);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireValidatedBody(req) {
  if (!req.validated?.body) {
    throw new AppError({
      statusCode: 500,
      message: "Validated body missing",
      errors: [{ code: "VALIDATED_BODY_MISSING" }],
    });
  }

  return req.validated.body;
}

module.exports = {
  validate,
  requireValidatedBody,
};
