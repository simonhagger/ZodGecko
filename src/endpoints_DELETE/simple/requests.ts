/**
 * @file src/endpoints/simple/requests.ts
 * @module simple.requests
 *
 * Type aliases for Simple endpoint requests.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  SimplePriceRequestSchema,
  SimpleTokenPriceByIdRequestSchema,
  SimpleSupportedVsCurrenciesRequestSchema,
} from "./schemas.js";

/** Type for GET /simple/price request. */
export type SimplePriceRequest = z.infer<typeof SimplePriceRequestSchema>;
/** Type for GET /simple/token_price/{id} request. */
export type SimpleTokenPriceByIdRequest = z.infer<typeof SimpleTokenPriceByIdRequestSchema>;
/** Type for GET /simple/supported_vs_currencies request. */
export type SimpleSupportedVsCurrenciesRequest = z.infer<
  typeof SimpleSupportedVsCurrenciesRequestSchema
>;
