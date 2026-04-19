const { z, successEnvelopeSchema } = require('./common');

const healthResponseSchema = successEnvelopeSchema(
  z.object({
    status: z.literal('ok'),
  }),
);

const metricsResponseSchema = successEnvelopeSchema(
  z.object({
    apps: z.number().int().nonnegative(),
    identities: z.number().int().nonnegative(),
    otp_codes: z.number().int().nonnegative(),
    active_refresh_tokens: z.number().int().nonnegative(),
  }),
);

module.exports = {
  healthResponseSchema,
  metricsResponseSchema,
};
