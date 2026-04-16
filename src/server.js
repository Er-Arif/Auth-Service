const { createApp } = require("./app");
const { env } = require("./config/env");
const { logger } = require("./lib/logger");

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Auth service listening");
});
