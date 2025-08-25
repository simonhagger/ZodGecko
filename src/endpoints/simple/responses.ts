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

export type SimplePriceResponse = z.infer<typeof SimplePriceResponseSchema>;
export type SimpleTokenPriceByIdResponse = z.infer<typeof SimpleTokenPriceByIdResponseSchema>;
export type SimpleSupportedVsCurrenciesResponse = z.infer<
  typeof SimpleSupportedVsCurrenciesResponseSchema
>;
