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
  SimpleTokenPriceResponseSchema,
  SupportedVsCurrenciesResponseSchema,
} from "./schemas.js";

export type SimplePriceResponse = z.infer<typeof SimplePriceResponseSchema>;
export type SimpleTokenPriceResponse = z.infer<typeof SimpleTokenPriceResponseSchema>;
export type SupportedVsCurrenciesResponse = z.infer<typeof SupportedVsCurrenciesResponseSchema>;
