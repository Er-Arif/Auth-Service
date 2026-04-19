const { createRouteModule } = require('../../routes/route-builder');
const { validate } = require('../../middlewares/validate');
const { adminAuth } = require('../../middlewares/admin-auth');
const { adminHeadersSchema } = require('../../schemas/headers');
const {
  createAppRequestSchema,
  updateAppRequestSchema,
  updateAppConfigRequestSchema,
  createAppSuccessSchema,
  appSuccessSchema,
} = require('../../schemas/apps');
const { errorEnvelopeSchema } = require('../../schemas/responses');
const { z } = require('../../schemas/common');
const appController = require('./app.controller');

const routes = [
  {
    method: 'post',
    path: '',
    tags: ['Apps'],
    description: 'Create a new client application',
    middlewares: [
      validate({ headers: adminHeadersSchema, body: createAppRequestSchema }),
      adminAuth,
    ],
    handler: appController.createApp.bind(appController),
    openapi: {
      request: {
        headers: adminHeadersSchema,
        body: { content: { 'application/json': { schema: createAppRequestSchema } } },
      },
      responses: {
        201: {
          description: 'App created successfully',
          content: { 'application/json': { schema: createAppSuccessSchema } },
        },
        400: {
          description: 'Error',
          content: { 'application/json': { schema: errorEnvelopeSchema } },
        },
      },
      security: [{ internalAdminKey: [] }],
    },
  },
  {
    method: 'get',
    path: '/:appId',
    tags: ['Apps'],
    description: 'Fetch app details',
    middlewares: [
      validate({ headers: adminHeadersSchema, params: z.object({ appId: z.string().min(1) }) }),
      adminAuth,
    ],
    handler: appController.getApp.bind(appController),
    openapi: {
      request: { headers: adminHeadersSchema, params: z.object({ appId: z.string().min(1) }) },
      responses: {
        200: {
          description: 'App fetched successfully',
          content: { 'application/json': { schema: appSuccessSchema } },
        },
      },
      security: [{ internalAdminKey: [] }],
    },
  },
  {
    method: 'patch',
    path: '/:appId',
    tags: ['Apps'],
    description: 'Update app details',
    middlewares: [
      validate({
        headers: adminHeadersSchema,
        params: z.object({ appId: z.string().min(1) }),
        body: updateAppRequestSchema,
      }),
      adminAuth,
    ],
    handler: appController.updateApp.bind(appController),
    openapi: {
      request: {
        headers: adminHeadersSchema,
        params: z.object({ appId: z.string().min(1) }),
        body: { content: { 'application/json': { schema: updateAppRequestSchema } } },
      },
      responses: {
        200: {
          description: 'App updated successfully',
          content: { 'application/json': { schema: appSuccessSchema } },
        },
      },
      security: [{ internalAdminKey: [] }],
    },
  },
  {
    method: 'patch',
    path: '/:appId/config',
    tags: ['Apps'],
    description: 'Update app configuration',
    middlewares: [
      validate({
        headers: adminHeadersSchema,
        params: z.object({ appId: z.string().min(1) }),
        body: updateAppConfigRequestSchema,
      }),
      adminAuth,
    ],
    handler: appController.updateAppConfig.bind(appController),
    openapi: {
      request: {
        headers: adminHeadersSchema,
        params: z.object({ appId: z.string().min(1) }),
        body: { content: { 'application/json': { schema: updateAppConfigRequestSchema } } },
      },
      responses: {
        200: {
          description: 'App config updated successfully',
          content: { 'application/json': { schema: appSuccessSchema } },
        },
      },
      security: [{ internalAdminKey: [] }],
    },
  },
];

module.exports = createRouteModule({
  basePath: '/apps',
  routes,
});
