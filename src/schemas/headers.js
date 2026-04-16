const { z } = require("./common");

const appHeadersSchema = z.object({
  "x-app-id": z.string().trim().min(1),
  "x-app-key": z.string().trim().min(1),
});

const authHeadersSchema = z.object({
  authorization: z.string().trim().startsWith("Bearer "),
});

const adminHeadersSchema = z.object({
  "x-internal-admin-key": z.string().trim().min(1),
});

module.exports = {
  appHeadersSchema,
  authHeadersSchema,
  adminHeadersSchema,
};
