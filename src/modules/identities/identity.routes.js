const { createRouteModule } = require("../../routes/route-builder");
const { validate } = require("../../middlewares/validate");
const { appAuth } = require("../../middlewares/app-auth");
const { userAuth } = require("../../middlewares/user-auth");
const { adminAuth } = require("../../middlewares/admin-auth");
const { appUserHeadersSchema, appAdminHeadersSchema } = require("../../schemas/headers");
const { verifyContactRequestSchema, identityResponseSchema } = require("../../schemas/identity");
const { otpSendSuccessSchema } = require("../../schemas/otp");
const { z } = require("../../schemas/common");
const identityController = require("./identity.controller");

const routes = [
  {
    method: "get",
    path: "/me",
    tags: ["Identities"],
    description: "Fetch current identity",
    middlewares: [validate({ headers: appUserHeadersSchema }), appAuth, userAuth],
    handler: identityController.getMe.bind(identityController),
    openapi: {
      request: { headers: appUserHeadersSchema },
      responses: {
        200: { description: "Identity fetched successfully", content: { "application/json": { schema: identityResponseSchema } } },
      },
      security: [{ appHeaders: [] }, { bearerAuth: [] }],
    },
  },
  {
    method: "post",
    path: "/verify-contact",
    tags: ["Identities"],
    description: "Start verification for a new contact method",
    middlewares: [validate({ headers: appUserHeadersSchema, body: verifyContactRequestSchema }), appAuth, userAuth],
    handler: identityController.verifyContact.bind(identityController),
    openapi: {
      request: { headers: appUserHeadersSchema, body: { content: { "application/json": { schema: verifyContactRequestSchema } } } },
      responses: {
        200: { description: "OTP sent successfully", content: { "application/json": { schema: otpSendSuccessSchema } } },
      },
      security: [{ appHeaders: [] }, { bearerAuth: [] }],
    },
  },
  {
    method: "get",
    path: "/:identityId",
    tags: ["Identities"],
    description: "Fetch identity by ID",
    middlewares: [validate({ headers: appAdminHeadersSchema, params: z.object({ identityId: z.string().uuid() }) }), appAuth, adminAuth],
    handler: identityController.getIdentityById.bind(identityController),
    openapi: {
      request: { headers: appAdminHeadersSchema, params: z.object({ identityId: z.string().uuid() }) },
      responses: {
        200: { description: "Identity fetched successfully", content: { "application/json": { schema: identityResponseSchema } } },
      },
      security: [{ appHeaders: [] }, { internalAdminKey: [] }],
    },
  },
];

module.exports = createRouteModule({
  basePath: "/identities",
  routes,
});
