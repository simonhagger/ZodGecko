/**
 * @file src/schemas/coins.by-id.history/base-response.ts
 * @module schemas/coins.by-id.history/base
 */

/** Schema building types */
import { buildCoinResponseShape } from "../_shared/coins.js";

/**
 * CoinGecko API response for /coins/{id}/history endpoint.
 */
export const baseResponseSchema = buildCoinResponseShape();
