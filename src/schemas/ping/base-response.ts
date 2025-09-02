/**
 * @file src/schemas/ping/base-response.ts
 * @module schemas/ping/base
 */

/** Zod import */
import { z } from "zod";

/**
 * @description CoinGecko API response schema for the /ping endpoint.
 * @example
 * {
 *  "gecko_says": "(V3) To the Moon!"
 * }
 */
export const baseResponseSchema = z.object({
  gecko_says: z.literal("(V3) To the Moon!"),
});
