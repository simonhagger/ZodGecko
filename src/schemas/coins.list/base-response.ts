/**
 * @file src/schemas/coins.list/base-response.ts
 * @module schemas/coins.list/base
 */

/** Schema building types */
import z from "zod";

/** Shared imports */
import { CoinId, CoinName, CoinSymbol, PlatformsEntry } from "../_shared/common.js";

/**
 * CoinGecko API response for /coins/list endpoint.
 */
export const baseResponseSchema = z.array(
  z.object({
    id: CoinId,
    symbol: CoinSymbol.nullable(),
    name: CoinName.nullable(),
    platforms: PlatformsEntry.nullable(),
  }),
);
