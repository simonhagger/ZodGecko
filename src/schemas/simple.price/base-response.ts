/**
 * @file src/schemas/simple.price/base-response.ts
 * @module schemas/simple.price/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { QuoteMap } from "../_shared/common.js";

/**
 * @description CoinGecko API response schema for the /simple/price endpoint.
 */
export const baseResponseSchema = z.record(z.string(), QuoteMap).nullish();
