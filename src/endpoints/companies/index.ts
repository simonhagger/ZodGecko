/**
 * @file src/endpoints/companies/index.ts
 * @module companies
 *
 * Public surface for the Companies endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `companies.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
