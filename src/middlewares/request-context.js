const crypto = require("crypto");
const pinoHttp = require("pino-http");
const { logger } = require("../lib/logger");

const requestLogger = pinoHttp({
  logger,
  genReqId(req) {
    return req.headers["x-request-id"] || crypto.randomUUID();
  },
  customSuccessMessage() {
    return "Request completed";
  },
  customErrorMessage() {
    return "Request errored";
  },
});

function requestContext(req, res, next) {
  req.context = {
    requestId: req.id,
    ipAddress:
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown",
  };
  next();
}

module.exports = {
  requestLogger,
  requestContext,
};
