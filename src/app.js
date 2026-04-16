const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { env } = require("./config/env");
const { requestLogger, requestContext } = require("./middlewares/request-context");
const { errorHandler } = require("./middlewares/error-handler");
const { notFoundHandler } = require("./middlewares/not-found");
const routes = require("./routes");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);
  app.use(requestContext);

  app.use(env.API_BASE_PATH, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
