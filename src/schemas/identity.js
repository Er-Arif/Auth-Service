const { z, targetTypeSchema, successEnvelopeSchema } = require("./common");
const { identityPayloadSchema } = require("./otp");

const verifyContactRequestSchema = z.object({
  target_type: targetTypeSchema,
  target_value: z.string().trim().min(1),
  purpose: z.literal("verify_identity"),
}).superRefine((data, ctx) => {
  if (data.target_type === "email" && !z.string().email().safeParse(data.target_value).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["target_value"],
      message: "TARGET_INVALID",
    });
  }

  if (data.target_type === "phone" && !/^\+?[1-9]\d{7,14}$/.test(data.target_value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["target_value"],
      message: "TARGET_INVALID",
    });
  }
});

const identityResponseSchema = successEnvelopeSchema(identityPayloadSchema);

module.exports = {
  verifyContactRequestSchema,
  identityResponseSchema,
};
