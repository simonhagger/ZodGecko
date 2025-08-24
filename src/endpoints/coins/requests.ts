/**
 * @file src/endpoints/coins/requests.ts
 * @module coins.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  MarketsRequestSchema,
  CoinsListRequestSchema,
  CoinDetailRequestSchema,
  HistoryRequestSchema,
  CoinTickersRequestSchema,
  MarketChartRequestSchema,
  MarketChartRangeRequestSchema,
  OhlcRequestSchema,
} from "./schemas.js";

/** Type for `GET /coins/markets` request. */
export type MarketsRequest = z.infer<typeof MarketsRequestSchema>;

/** Type for `GET /coins/list` request. */
export type CoinsListRequest = z.infer<typeof CoinsListRequestSchema>;

/** Type for `GET /coins/{id}` request. */
export type CoinDetailRequest = z.infer<typeof CoinDetailRequestSchema>;

/** Type for `GET /coins/{id}/history` request. */
export type HistoryRequest = z.infer<typeof HistoryRequestSchema>;

/** Type for `GET /coins/{id}/tickers` request. */
export type CoinTickersRequest = z.infer<typeof CoinTickersRequestSchema>;

/** Type for `GET /coins/{id}/market_chart` request. */
export type MarketChartRequest = z.infer<typeof MarketChartRequestSchema>;

/** Type for `GET /coins/{id}/market_chart/range` request. */
export type MarketChartRangeRequest = z.infer<typeof MarketChartRangeRequestSchema>;

/** Type for `GET /coins/{id}/ohlc` request. */
export type OhlcRequest = z.infer<typeof OhlcRequestSchema>;
