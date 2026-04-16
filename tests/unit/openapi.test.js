const test = require("node:test");
const assert = require("node:assert/strict");
const { registry } = require("../../src/openapi/registry");

test("route registry registers route metadata for future OpenAPI generation", () => {
  require("../../src/routes");
  assert.ok(registry.definitions.length > 0);
});
