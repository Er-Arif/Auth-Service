const {
  z,
  targetTypeSchema,
  otpPurposeSchema,
  deliveryChannelSchema,
  metadataSchema,
  deviceIdSchema,
  successEnvelopeSchema,
} = require('./common');

const otpSendRequestSchema = z
  .object({
    target_type: targetTypeSchema,
    target_value: z.string().trim().min(1),
    purpose: otpPurposeSchema,
    device_id: deviceIdSchema,
    metadata: metadataSchema,
  })
  .superRefine((data, ctx) => {
    if (data.target_type === 'email' && !z.string().email().safeParse(data.target_value).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_value'],
        message: 'TARGET_INVALID',
      });
    }

    if (data.target_type === 'phone' && !/^\+?[1-9]\d{7,14}$/.test(data.target_value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_value'],
        message: 'TARGET_INVALID',
      });
    }
  });

const otpVerifyRequestSchema = z
  .object({
    target_type: targetTypeSchema,
    target_value: z.string().trim().min(1),
    otp: z.string().regex(/^\d{6}$/),
    purpose: otpPurposeSchema,
    device_id: deviceIdSchema,
  })
  .superRefine((data, ctx) => {
    if (data.target_type === 'email' && !z.string().email().safeParse(data.target_value).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_value'],
        message: 'TARGET_INVALID',
      });
    }

    if (data.target_type === 'phone' && !/^\+?[1-9]\d{7,14}$/.test(data.target_value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_value'],
        message: 'TARGET_INVALID',
      });
    }
  });

const otpResendRequestSchema = z
  .object({
    target_type: targetTypeSchema,
    target_value: z.string().trim().min(1),
    purpose: otpPurposeSchema,
    device_id: deviceIdSchema,
  })
  .superRefine((data, ctx) => {
    if (data.target_type === 'email' && !z.string().email().safeParse(data.target_value).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_value'],
        message: 'TARGET_INVALID',
      });
    }

    if (data.target_type === 'phone' && !/^\+?[1-9]\d{7,14}$/.test(data.target_value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_value'],
        message: 'TARGET_INVALID',
      });
    }
  });

const otpSendSuccessSchema = successEnvelopeSchema(
  z.object({
    target_type: targetTypeSchema,
    target_value_masked: z.string(),
    purpose: otpPurposeSchema,
    retry_after_seconds: z.number().int().nonnegative(),
    delivery_channel: deliveryChannelSchema,
  }),
);

const identityPayloadSchema = z.object({
  id: z.string().uuid(),
  app_id: z.string(),
  identity_type: targetTypeSchema,
  identity_value: z.string(),
  is_verified: z.boolean(),
  metadata: z.record(z.any()).default({}),
});

const otpVerifySuccessSchema = successEnvelopeSchema(
  z.object({
    identity: identityPayloadSchema.omit({ metadata: true }),
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.literal('Bearer'),
    expires_in: z.number().int().positive(),
  }),
);

const otpResendSuccessSchema = successEnvelopeSchema(
  z.object({
    retry_after_seconds: z.number().int().nonnegative(),
  }),
);

module.exports = {
  otpSendRequestSchema,
  otpVerifyRequestSchema,
  otpResendRequestSchema,
  otpSendSuccessSchema,
  otpVerifySuccessSchema,
  otpResendSuccessSchema,
  identityPayloadSchema,
};
