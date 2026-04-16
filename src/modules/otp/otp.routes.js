const { createRouteModule } = require("../../routes/route-builder");
const { validate } = require("../../middlewares/validate");
const { appAuth } = require("../../middlewares/app-auth");
const { appHeadersSchema } = require("../../schemas/headers");
const { otpSendRequestSchema, otpVerifyRequestSchema, otpResendRequestSchema, otpSendSuccessSchema, otpVerifySuccessSchema, otpResendSuccessSchema } = require("../../schemas/otp");
const { errorEnvelopeSchema } = require("../../schemas/responses");
const otpController = require("./otp.controller");

const routes = [
  {
    method: "post",
    path: "/send",
    tags: ["OTP"],
    description: "Send OTP",
    middlewares: [validate({ headers: appHeadersSchema, body: otpSendRequestSchema }), appAuth],
    handler: otpController.sendOtp.bind(otpController),
    openapi: {
      request: { headers: appHeadersSchema, body: { content: { "application/json": { schema: otpSendRequestSchema } } } },
      responses: {
        200: { description: "OTP sent successfully", content: { "application/json": { schema: otpSendSuccessSchema } } },
        429: { description: "Send OTP error", content: { "application/json": { schema: errorEnvelopeSchema } } },
      },
      security: [{ appHeaders: [] }],
    },
  },
  {
    method: "post",
    path: "/verify",
    tags: ["OTP"],
    description: "Verify OTP",
    middlewares: [validate({ headers: appHeadersSchema, body: otpVerifyRequestSchema }), appAuth],
    handler: otpController.verifyOtp.bind(otpController),
    openapi: {
      request: { headers: appHeadersSchema, body: { content: { "application/json": { schema: otpVerifyRequestSchema } } } },
      responses: {
        200: { description: "OTP verified successfully", content: { "application/json": { schema: otpVerifySuccessSchema } } },
        422: { description: "Verify OTP error", content: { "application/json": { schema: errorEnvelopeSchema } } },
      },
      security: [{ appHeaders: [] }],
    },
  },
  {
    method: "post",
    path: "/resend",
    tags: ["OTP"],
    description: "Resend OTP",
    middlewares: [validate({ headers: appHeadersSchema, body: otpResendRequestSchema }), appAuth],
    handler: otpController.resendOtp.bind(otpController),
    openapi: {
      request: { headers: appHeadersSchema, body: { content: { "application/json": { schema: otpResendRequestSchema } } } },
      responses: {
        200: { description: "OTP resent successfully", content: { "application/json": { schema: otpResendSuccessSchema } } },
        429: { description: "Resend OTP error", content: { "application/json": { schema: errorEnvelopeSchema } } },
      },
      security: [{ appHeaders: [] }],
    },
  },
];

module.exports = createRouteModule({
  basePath: "/otp",
  routes,
});
