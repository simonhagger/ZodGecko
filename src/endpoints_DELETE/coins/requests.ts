/**
 * @file src/endpoints/coins/requests.ts
 * @module coins.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  CoinsMarketsRequestSchema,
  CoinsListRequestSchema,
  CoinsByIdRequestSchema,
  CoinsByIdHistoryRequestSchema,
  CoinsByIdTickersRequestSchema,
  CoinsByIdMarketChartRequestSchema,
  CoinsByIdMarketChartRangeRequestSchema,
  CoinsByIdOhlcRequestSchema,
} from "./schemas.js";

/** Type for `GET /coins/markets` request. */
export type CoinsMarketsRequest = z.infer<typeof CoinsMarketsRequestSchema>;

/** Type for `GET /coins/list` request. */
export type CoinsListRequest = z.infer<typeof CoinsListRequestSchema>;

/** Type for `GET /coins/{id}` request. */
export type CoinsByIdRequest = z.infer<typeof CoinsByIdRequestSchema>;

/** Type for `GET /coins/{id}/history` request. */
export type CoinsByIdHistoryRequest = z.infer<typeof CoinsByIdHistoryRequestSchema>;

/** Type for `GET /coins/{id}/tickers` request. */
export type CoinsByIdTickersRequest = z.infer<typeof CoinsByIdTickersRequestSchema>;

/** Type for `GET /coins/{id}/market_chart` request. */
export type CoinsByIdMarketChartRequest = z.infer<typeof CoinsByIdMarketChartRequestSchema>;

/** Type for `GET /coins/{id}/market_chart/range` request. */
export type CoinsByIdMarketChartRangeRequest = z.infer<
  typeof CoinsByIdMarketChartRangeRequestSchema
>;

/** Type for `GET /coins/{id}/ohlc` request. */
export type CoinsByIdOhlcRequest = z.infer<typeof CoinsByIdOhlcRequestSchema>;
