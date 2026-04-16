const { ZodError } = require("zod");
const { logger } = require("../lib/logger");
const { AppError } = require("../utils/errors");
const { errorResponse } = require("../utils/response");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    const hasTargetInvalid = error.issues.some((issue) => issue.message === "TARGET_INVALID");
    return res.status(422).json(
      errorResponse({
        message: hasTargetInvalid ? "Invalid target value" : "Validation failed",
        errors: error.issues.map((issue) => ({
          field: issue.path.join(".") || undefined,
          code: /^[A-Z0-9_]+$/.test(issue.message) ? issue.message : "VALIDATION_ERROR",
        })),
      }),
    );
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      errorResponse({
        message: error.message,
        errors: error.errors,
      }),
    );
  }

  logger.error({ err: error }, "Unhandled application error");

  return res.status(500).json(
    errorResponse({
      message: "Internal server error",
      errors: [
        {
          code: "INTERNAL_SERVER_ERROR",
        },
      ],
    }),
  );
}

module.exports = { errorHandler };
