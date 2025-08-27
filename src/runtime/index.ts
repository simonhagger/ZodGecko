/**
 * @file src / runtime / index.ts
 * @module runtime
 *
 * Public namespaces for runtime functions.
 */

// Query (endpoint-aware: defaults, dropping, normalization)
export { buildQuery } from "./query.js";

// URL helpers (runtime layer over core)
export {
  DEFAULT_BASE,
  formatPath, // re-exported from runtime/url (delegates to core)
  joinBaseAndPath, // re-exported from runtime/url (delegates to core)
  toURL,
  qsString,
} from "./url.js";

// Server defaults (lookup + constants)
export { SERVER_DEFAULTS, getServerDefaults } from "./server-defaults.js";

// Composition helpers
export { withDefaults } from "./with-defaults.js";

// Endpoints (registry + typed schema accessors)
export {
  type Endpoint,
  ALL_ENDPOINTS,
  type RequestSchemaOf,
  type ResponseSchemaOf,
  getRequestSchema,
  getResponseSchema,
  getSchemas,
} from "./endpoints.js";

// Validation (endpoint-derived; result-returning)
export { validateRequest, validateResponse, type ValidationResult } from "./validate.js";
