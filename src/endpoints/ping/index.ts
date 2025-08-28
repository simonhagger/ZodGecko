/**
 * @file src/endpoints/ping/index.ts
 * @module ping
 *
 * Public surface for the Ping endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `ping.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
