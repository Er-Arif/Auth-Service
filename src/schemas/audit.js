const { z, successEnvelopeSchema } = require('./common');

const auditLogQuerySchema = z.object({
  app_id: z.string().trim().min(1).optional(),
  target_type: z.string().trim().optional(),
  target_value: z.string().trim().optional(),
  event_type: z.string().trim().optional(),
  status: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const auditLogsResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(
      z.object({
        id: z.string().uuid(),
        app_id: z.string(),
        event_type: z.string(),
        target_type: z.string().nullable(),
        target_value: z.string().nullable(),
        ip_address: z.string().nullable(),
        device_id: z.string().nullable(),
        status: z.string(),
        message: z.string(),
        metadata: z.record(z.any()).nullable(),
        created_at: z.string(),
      }),
    ),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
);

module.exports = {
  auditLogQuerySchema,
  auditLogsResponseSchema,
};
