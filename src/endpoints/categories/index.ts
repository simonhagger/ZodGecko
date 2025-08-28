/**
 * @file src/endpoints/categories/index.ts
 * @module categories
 *
 * Public surface for the Categories endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `categories.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
