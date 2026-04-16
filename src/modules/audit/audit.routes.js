const { createRouteModule } = require("../../routes/route-builder");
const { validate } = require("../../middlewares/validate");
const { adminAuth } = require("../../middlewares/admin-auth");
const { adminHeadersSchema } = require("../../schemas/headers");
const { auditLogQuerySchema, auditLogsResponseSchema } = require("../../schemas/audit");
const auditController = require("./audit.controller");

const routes = [
  {
    method: "get",
    path: "",
    tags: ["Audit"],
    description: "Fetch audit logs",
    middlewares: [validate({ headers: adminHeadersSchema, query: auditLogQuerySchema }), adminAuth],
    handler: auditController.listLogs.bind(auditController),
    openapi: {
      request: { headers: adminHeadersSchema, query: auditLogQuerySchema },
      responses: {
        200: { description: "Audit logs fetched successfully", content: { "application/json": { schema: auditLogsResponseSchema } } },
      },
      security: [{ internalAdminKey: [] }],
    },
  },
];

module.exports = createRouteModule({
  basePath: "/audit-logs",
  routes,
});
