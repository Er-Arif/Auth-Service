const { createRouteModule } = require('../../routes/route-builder');
const { validate } = require('../../middlewares/validate');
const { adminAuth } = require('../../middlewares/admin-auth');
const { adminHeadersSchema } = require('../../schemas/headers');
const { healthResponseSchema, metricsResponseSchema } = require('../../schemas/health');
const opsController = require('./ops.controller');

const routes = [
  {
    method: 'get',
    path: '/health',
    tags: ['Ops'],
    description: 'Health check',
    middlewares: [],
    handler: opsController.health.bind(opsController),
    openapi: {
      responses: {
        200: {
          description: 'Service healthy',
          content: { 'application/json': { schema: healthResponseSchema } },
        },
      },
    },
  },
  {
    method: 'get',
    path: '/metrics',
    tags: ['Ops'],
    description: 'Internal metrics',
    middlewares: [validate({ headers: adminHeadersSchema }), adminAuth],
    handler: opsController.metrics.bind(opsController),
    openapi: {
      request: { headers: adminHeadersSchema },
      responses: {
        200: {
          description: 'Metrics fetched successfully',
          content: { 'application/json': { schema: metricsResponseSchema } },
        },
      },
      security: [{ internalAdminKey: [] }],
    },
  },
];

module.exports = createRouteModule({
  basePath: '',
  routes,
});
