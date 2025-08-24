/**
 * @file src/endpoints/companies/index.ts
 * @module companies
 *
 * Public surface for the Companies endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `companies.schemas`.
 */

export type { CompaniesTreasuryRequest } from "./requests.js";

export type { Company, CompaniesTreasuryResponse } from "./responses.js";

export * as schemas from "./schemas.js";
