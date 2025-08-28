/**
 * @file src/endpoints/exchanges/index.ts
 * @module exchanges
 *
 * Public surface for the Exchanges endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `exchanges.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
