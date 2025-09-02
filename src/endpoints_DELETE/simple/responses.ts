/**
 * @file src/endpoints/simple/responses.ts
 * @module simple.responses
 *
 * Type aliases for Simple endpoint responses.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  SimplePriceResponseSchema,
  SimpleTokenPriceByIdResponseSchema,
  SimpleSupportedVsCurrenciesResponseSchema,
} from "./schemas.js";

/** Type for GET /simple/price response. */
export type SimplePriceResponse = z.infer<typeof SimplePriceResponseSchema>;
/** Type for GET /simple/token_price/{id} response. */
export type SimpleTokenPriceByIdResponse = z.infer<typeof SimpleTokenPriceByIdResponseSchema>;
/** Type for GET /simple/supported_vs_currencies response. */
export type SimpleSupportedVsCurrenciesResponse = z.infer<
  typeof SimpleSupportedVsCurrenciesResponseSchema
>;
