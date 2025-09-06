/**
 * @file src/schemas/simple.token_price.by-id/base-response.ts
 * @module schemas/simple.token_price.by-id/base-response
 * @summary Base Response.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { ContractAddress, QuoteMap } from "../_shared/common.js";

/**
 * @description CoinGecko API response schema for the /simple/token_price/{id} endpoint.
 */
export const baseResponseSchema = z.record(ContractAddress, QuoteMap).nullable().optional();
