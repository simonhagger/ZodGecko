/**
 * @file src/schemas/simple.supported_vs_currencies/base-response.ts
 * @module schemas/simple.supported_vs_currencies/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {} from "../_shared/common.js";

/**
 * @description CoinGecko API response schema for the /simple/supported_vs_currencies endpoint.
 */
export const baseResponseSchema = z.array(z.string());
