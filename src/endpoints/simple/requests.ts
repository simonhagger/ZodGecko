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
  SimpleTokenPriceRequestSchema,
  SupportedVsCurrenciesRequestSchema,
} from "./schemas.js";

export type SimplePriceRequest = z.infer<typeof SimplePriceRequestSchema>;
export type SimpleTokenPriceRequest = z.infer<typeof SimpleTokenPriceRequestSchema>;
export type SupportedVsCurrenciesRequest = z.infer<typeof SupportedVsCurrenciesRequestSchema>;
