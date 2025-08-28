/**
 * @file src/endpoints/contract/index.ts
 * @module contract
 *
 * Public surface for the Contract endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `contract.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
