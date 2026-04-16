const { createRouteModule } = require("../../routes/route-builder");
const { validate } = require("../../middlewares/validate");
const { appAuth } = require("../../middlewares/app-auth");
const { userAuth } = require("../../middlewares/user-auth");
const { appHeadersSchema, appUserHeadersSchema } = require("../../schemas/headers");
const { refreshRequestSchema, logoutRequestSchema, logoutAllRequestSchema, refreshSuccessSchema, logoutSuccessSchema } = require("../../schemas/auth");
const authController = require("./auth.controller");

const routes = [
  {
    method: "post",
    path: "/refresh",
    tags: ["Auth"],
    description: "Refresh access token",
    middlewares: [validate({ headers: appHeadersSchema, body: refreshRequestSchema }), appAuth],
    handler: authController.refresh.bind(authController),
    openapi: {
      request: { headers: appHeadersSchema, body: { content: { "application/json": { schema: refreshRequestSchema } } } },
      responses: {
        200: { description: "Token refreshed successfully", content: { "application/json": { schema: refreshSuccessSchema } } },
      },
      security: [{ appHeaders: [] }],
    },
  },
  {
    method: "post",
    path: "/logout",
    tags: ["Auth"],
    description: "Logout current refresh token",
    middlewares: [validate({ headers: appHeadersSchema, body: logoutRequestSchema }), appAuth],
    handler: authController.logout.bind(authController),
    openapi: {
      request: { headers: appHeadersSchema, body: { content: { "application/json": { schema: logoutRequestSchema } } } },
      responses: {
        200: { description: "Logged out successfully", content: { "application/json": { schema: logoutSuccessSchema } } },
      },
      security: [{ appHeaders: [] }],
    },
  },
  {
    method: "post",
    path: "/logout-all",
    tags: ["Auth"],
    description: "Logout all sessions for the current identity",
    middlewares: [validate({ headers: appUserHeadersSchema, body: logoutAllRequestSchema }), appAuth, userAuth],
    handler: authController.logoutAll.bind(authController),
    openapi: {
      request: { headers: appUserHeadersSchema, body: { content: { "application/json": { schema: logoutAllRequestSchema } } } },
      responses: {
        200: { description: "Logged out from all devices successfully", content: { "application/json": { schema: logoutSuccessSchema } } },
      },
      security: [{ appHeaders: [] }, { bearerAuth: [] }],
    },
  },
];

module.exports = createRouteModule({
  basePath: "/auth",
  routes,
});
