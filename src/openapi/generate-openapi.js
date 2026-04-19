const fs = require('fs');
const path = require('path');
const { OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const { env } = require('../config/env');
const { registry } = require('./registry');
require('../routes');

function generateSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'OpenAPI spec generated from shared route metadata and Zod schemas.',
    },
    components: {
      securitySchemes: {
        appHeaders: {
          type: 'apiKey',
          in: 'header',
          name: 'x-app-id',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        internalAdminKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-internal-admin-key',
        },
      },
    },
    servers: [
      {
        url: env.API_BASE_PATH,
      },
    ],
  });

  const outputPath = path.resolve(process.cwd(), env.OPENAPI_OUTPUT_PATH);
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
}

generateSpec();
