/**
 * @file src / core / index.ts
 * @module core
 *
 * Public namespaces for all core exports.
 *
 */
export * from "./primitives.js";
export * from "./common.js";
export * from "./helpers.js";
export * from "./parse-utils.js";
export {
  type PathParams,
  formatPath,
  formatPathSafe,
  formatPathStrict,
  pathParamKeys,
  dropPathParamsByTemplate,
  joinBaseAndPath,
  ensureLeadingSlash,
  isAbsoluteUrl,
} from "./url.js";
// Pure query utilities (stable, framework-agnostic)
export { normalizeQuery, queryString, queryParams, normalizeDefault } from "./query.js";
