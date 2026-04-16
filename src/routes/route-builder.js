const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { registerRoute } = require("../openapi/registry");

function createRouteModule({ basePath = "", routes = [] }) {
  const router = express.Router();

  routes.forEach((route) => {
    const middlewares = route.middlewares || [];
    const fullPath = `${basePath}${route.path}`;

    registerRoute({
      ...route,
      fullPath,
    });

    router[route.method](route.path, ...middlewares, asyncHandler(route.handler));
  });

  return router;
}

module.exports = {
  createRouteModule,
};
