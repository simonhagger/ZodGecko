/**
 * @file src/endpoints/coins/index.ts
 * @module coins
 *
 * Public surface for the Coins endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `coins.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
