const {
  z,
  uuidSchema,
  deviceIdSchema,
  successEnvelopeSchema,
} = require("./common");
const { emptyDataSchema } = require("./responses");

const refreshRequestSchema = z.object({
  refresh_token: z.string().trim().min(1),
  device_id: deviceIdSchema,
});

const logoutRequestSchema = refreshRequestSchema;

const logoutAllRequestSchema = z.object({
  identity_id: uuidSchema,
});

const refreshSuccessSchema = successEnvelopeSchema(
  z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.literal("Bearer"),
    expires_in: z.number().int().positive(),
  }),
);

const logoutSuccessSchema = successEnvelopeSchema(emptyDataSchema);

module.exports = {
  refreshRequestSchema,
  logoutRequestSchema,
  logoutAllRequestSchema,
  refreshSuccessSchema,
  logoutSuccessSchema,
};
