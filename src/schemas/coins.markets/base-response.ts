/**
 * @file src/schemas/coins.markets/base-response.ts
 * @module schemas/coins.markets/base-response
 * @summary Base Response.
 */

/** Zod import */
import { z } from "zod";

/** Schema building types */
import {
  ISODateTime,
  NonEmptyString,
  NullishNumber,
  NullishString,
  tolerantObject,
  UrlStringOrUndefined,
} from "../_shared/common.js";

/**
 * Market row for /coins/markets.
 * Tolerant to extra fields; key metrics are optional/nullable per API behavior.
 */
export const rowSchema = tolerantObject({
  id: NonEmptyString,
  symbol: NullishString,
  name: NullishString,
  image: UrlStringOrUndefined.optional(),
  current_price: NullishNumber,
  market_cap: NullishNumber,
  market_cap_rank: NullishNumber,
  total_volume: NullishNumber,
  price_change_percentage_24h: NullishNumber,
  last_updated: ISODateTime.optional(),
});

/** Array of market rows. */
export const baseResponseSchema = z.array(rowSchema);
