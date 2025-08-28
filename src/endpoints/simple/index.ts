/**
 * @file src/endpoints/simple/index.ts
 * @module simple
 *
 * Public surface for the Simple endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `simple.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
