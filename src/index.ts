/**
 * @file src/index.ts
 * @module index
 *
 * Public API — helpers + registry readers + types.
 *
 * Notes:
 * - The minimal fetch client lives under a separate entry: `zodgecko/fetch`.
 * - Registry internals (generated data) are not exported from the root.
 * - Keep this barrel tight and predictable.
  * @summary Index.
 */

/* --------------------------------- Helpers -------------------------------- */

export { explainError } from "./helpers/explain-error.js";
export { formatParams, formatParamsForEndpoint } from "./helpers/format-params.js";
export { formatPath } from "./helpers/format-path.js";
export { getRequestFor } from "./helpers/get-request-for.js";
export { parseRequest } from "./helpers/parse-request.js";
export { parseResponse } from "./helpers/parse-response.js";
export { toURL } from "./helpers/to-url.js";
export { getSchemas } from "./helpers/get-schemas.js";

/* ------------------------------- Registry I/O ------------------------------ */
/* Read-only accessors for endpoint metadata; useful for advanced consumers. */

export {
  getPathInfo,
  getQueryRules,
  getResponseSchema,
  getRequestSchema,
  getServerDefaults,
  listEndpoints,
} from "./registry/index.js";

/* ---------------------------------- Types --------------------------------- */

export type {
  ApiPlan,
  ApiVersion,
  QueryPrimitive,
  QueryValue,
  RequestShape,
  VersionPlanPair,
} from "./types.js";

export { PLANS, VERSIONS, VERSION_TO_PLAN } from "./helpers/constants.js";
export { isValidVersionPlan } from "./helpers/object.js";

/* --------------------------------- Fetch API ------------------------------- */
/* Intentionally not re-exported here:
   import from "zodgecko/fetch" for the minimal fetch client. */
