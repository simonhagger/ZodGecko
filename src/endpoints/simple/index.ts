/**
 * @file src/endpoints/simple/index.ts
 * @module simple
 *
 * Public surface for the Simple endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `simple.schemas`.
 */

export type {
  SimplePriceRequest,
  SimpleTokenPriceRequest,
  SupportedVsCurrenciesRequest,
} from "./requests.js";

export type {
  SimplePriceResponse,
  SimpleTokenPriceResponse,
  SupportedVsCurrenciesResponse,
} from "./responses.js";

export * as schemas from "./schemas.js";
