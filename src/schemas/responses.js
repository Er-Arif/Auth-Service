const { z, successEnvelopeSchema, errorEnvelopeSchema } = require('./common');

const emptyDataSchema = z.object({});

const standardErrorResponses = {
  400: errorEnvelopeSchema,
  401: errorEnvelopeSchema,
  403: errorEnvelopeSchema,
  404: errorEnvelopeSchema,
  409: errorEnvelopeSchema,
  422: errorEnvelopeSchema,
  429: errorEnvelopeSchema,
  500: errorEnvelopeSchema,
};

module.exports = {
  emptyDataSchema,
  errorEnvelopeSchema,
  successEnvelopeSchema,
  standardErrorResponses,
};
