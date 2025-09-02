/**
 * @file src/endpoints/coins/responses.ts
 * @module coins.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  CoinsMarketsResponseSchema,
  CoinsListResponseSchema,
  CoinsByIdResponseSchema,
  CoinsByIdHistoryResponseSchema,
  CoinsByIdTickersResponseSchema,
  CoinsByIdMarketChartResponseSchema,
  CoinsByIdMarketChartRangeResponseSchema,
  CoinsByIdOhlcResponseSchema,
  CoinsMarketsRowSchema,
  CoinsListItemSchema,
} from "./schemas.js";

/** Type for `GET /coins/markets` response. */
export type CoinsMarketsResponse = z.infer<typeof CoinsMarketsResponseSchema>;
/** Item type for /coins/markets row. */
export type CoinsMarketsRow = z.infer<typeof CoinsMarketsRowSchema>;

/** Type for `GET /coins/list` response. */
export type CoinsListResponse = z.infer<typeof CoinsListResponseSchema>;
/** Item type for /coins/list row. */
export type CoinsListItem = z.infer<typeof CoinsListItemSchema>;

/** Type for `GET /coins/{id}` response. */
export type CoinsByIdResponse = z.infer<typeof CoinsByIdResponseSchema>;

/** Type for `GET /coins/{id}/history` response. */
export type CoinsByIdHistoryResponse = z.infer<typeof CoinsByIdHistoryResponseSchema>;

/** Type for `GET /coins/{id}/tickers` response. */
export type CoinsByIdTickersResponse = z.infer<typeof CoinsByIdTickersResponseSchema>;

/** Type for `GET /coins/{id}/market_chart` response. */
export type CoinsByIdMarketChartResponse = z.infer<typeof CoinsByIdMarketChartResponseSchema>;

/** Type for `GET /coins/{id}/market_chart/range` response. */
export type CoinsByIdMarketChartRangeResponse = z.infer<
  typeof CoinsByIdMarketChartRangeResponseSchema
>;

/** Type for `GET /coins/{id}/ohlc` response. */
export type CoinsByIdOhlcResponse = z.infer<typeof CoinsByIdOhlcResponseSchema>;
