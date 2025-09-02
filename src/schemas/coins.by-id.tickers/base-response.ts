/**
 * @file src/schemas/coins.by-id.tickers/base-response.ts
 * @module schemas/coins.by-id.tickers/base
 */

/** Schema building types */
import z from "zod";

/** Shared imports */
import {
  CoinId,
  ISODateTime,
  NullishBoolean,
  NullishNumber,
  NullishString,
  QuoteMap,
  UrlStringOrUndefined,
} from "../_shared/common.js";

/**
 * CoinGecko API response for /coins/{id}/tickers endpoint.
 */
export const baseResponseSchema = z.looseObject({
  name: NullishString,
  tickers: z.array(
    z.object({
      base: NullishString,
      target: NullishString,
      market: z.object({
        name: NullishString,
        identifier: NullishString,
        has_trading_incentive: NullishBoolean,
        logo: UrlStringOrUndefined.nullish(),
      }),
      last: NullishNumber,
      volume: NullishNumber,
      cost_to_move_up_usd: NullishNumber,
      cost_to_move_down_usd: NullishNumber,
      converted_last: QuoteMap,
      converted_volume: QuoteMap,
      trust_score: NullishString,
      bid_ask_spread_percentage: NullishNumber,
      timestamp: ISODateTime.nullish(),
      last_traded_at: ISODateTime.nullish(),
      last_fetch_at: ISODateTime.nullish(),
      is_anomaly: NullishBoolean,
      is_stale: NullishBoolean,
      trade_url: UrlStringOrUndefined.nullish(),
      token_info_url: UrlStringOrUndefined.nullish(),
      coin_id: CoinId.nullish(),
      target_coin_id: CoinId.nullish(),
    }),
  ),
});
