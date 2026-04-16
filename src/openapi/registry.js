const { OpenAPIRegistry } = require("@asteasolutions/zod-to-openapi");

const registry = new OpenAPIRegistry();

function registerRoute(routeDefinition) {
  registry.registerPath({
    method: routeDefinition.method,
    path: routeDefinition.fullPath,
    tags: routeDefinition.tags || [],
    description: routeDefinition.description,
    request: routeDefinition.openapi?.request,
    responses: routeDefinition.openapi?.responses || {},
    security: routeDefinition.openapi?.security || [],
  });
}

module.exports = {
  registry,
  registerRoute,
};
