const {
  z,
  appStatusSchema,
  targetTypeSchema,
  deliveryChannelSchema,
  successEnvelopeSchema,
} = require('./common');
const { EMAIL_PROVIDERS, SMS_PROVIDERS } = require('../config/constants');

const appConfigSchema = z.object({
  default_target_type: targetTypeSchema,
  otp_expiry_minutes: z.number().int().positive(),
  resend_cooldown_seconds: z.number().int().positive(),
  max_attempts: z.number().int().positive(),
  max_requests_per_hour_per_target: z.number().int().positive(),
  max_requests_per_hour_per_ip: z.number().int().positive(),
  max_resend_count: z.number().int().positive(),
  active_channel: deliveryChannelSchema,
  email_provider: z.enum([EMAIL_PROVIDERS.SMTP, EMAIL_PROVIDERS.RESEND, EMAIL_PROVIDERS.MOCK]),
  sms_provider: z.enum([SMS_PROVIDERS.MSG91, SMS_PROVIDERS.FAST2SMS, SMS_PROVIDERS.MOCK]),
  access_token_ttl_minutes: z.number().int().positive(),
  refresh_token_ttl_days: z.number().int().positive(),
});

const createAppRequestSchema = z.object({
  app_id: z.string().trim().min(3).max(64),
  name: z.string().trim().min(1).max(255),
  status: appStatusSchema,
});

const updateAppRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    status: appStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

const updateAppConfigRequestSchema = appConfigSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

const appDataSchema = z.object({
  id: z.string().uuid(),
  app_id: z.string(),
  name: z.string(),
  status: appStatusSchema,
});

const appWithConfigDataSchema = appDataSchema.extend({
  config: appConfigSchema,
});

const createAppSuccessSchema = successEnvelopeSchema(
  appDataSchema.extend({
    app_key: z.string(),
  }),
);

const appSuccessSchema = successEnvelopeSchema(appWithConfigDataSchema);

module.exports = {
  appConfigSchema,
  createAppRequestSchema,
  updateAppRequestSchema,
  updateAppConfigRequestSchema,
  createAppSuccessSchema,
  appSuccessSchema,
};
