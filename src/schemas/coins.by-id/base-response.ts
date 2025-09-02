/**
 * @file src/schemas/coins.by-id/base-response.ts
 * @module schemas/coins.by-id/base
 */

/** Schema building types */
import { buildCoinResponseShape } from "../_shared/coins.js";

/**
 * CoinGecko API response for /coins/{id}
 * @description Uses a factory to build the schema due to the fact that the schema is used by another endpoint also.
 */
export const baseResponseSchema = buildCoinResponseShape();
