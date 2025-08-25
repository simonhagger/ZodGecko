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

export type SimplePriceRequest = z.infer<typeof SimplePriceRequestSchema>;
export type SimpleTokenPriceByIdRequest = z.infer<typeof SimpleTokenPriceByIdRequestSchema>;
export type SimpleSupportedVsCurrenciesRequest = z.infer<
  typeof SimpleSupportedVsCurrenciesRequestSchema
>;
