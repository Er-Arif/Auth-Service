const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
const { z } = require('zod');
const {
  OTP_PURPOSES,
  TARGET_TYPES,
  APP_STATUS,
  DELIVERY_CHANNELS,
} = require('../config/constants');

extendZodWithOpenApi(z);

const uuidSchema = z.string().uuid();
const targetTypeSchema = z.enum([TARGET_TYPES.EMAIL, TARGET_TYPES.PHONE]);
const otpPurposeSchema = z.enum([
  OTP_PURPOSES.LOGIN,
  OTP_PURPOSES.SIGNUP,
  OTP_PURPOSES.VERIFY_IDENTITY,
  OTP_PURPOSES.RESET,
]);
const appStatusSchema = z.enum([APP_STATUS.ACTIVE, APP_STATUS.INACTIVE]);
const deliveryChannelSchema = z.enum([
  DELIVERY_CHANNELS.EMAIL,
  DELIVERY_CHANNELS.SMS,
  DELIVERY_CHANNELS.MOCK,
]);

const metadataSchema = z.record(z.any()).optional();
const deviceIdSchema = z.string().trim().min(1).max(128).optional();

const successEnvelopeSchema = (dataSchema) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

const errorItemSchema = z.object({
  field: z.string().optional(),
  code: z.string(),
});

const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(errorItemSchema),
});

module.exports = {
  z,
  uuidSchema,
  targetTypeSchema,
  otpPurposeSchema,
  appStatusSchema,
  deliveryChannelSchema,
  metadataSchema,
  deviceIdSchema,
  successEnvelopeSchema,
  errorItemSchema,
  errorEnvelopeSchema,
};
