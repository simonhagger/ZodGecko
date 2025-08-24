/**
 * @file src/endpoints/coins/responses.ts
 * @module coins.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  MarketsResponseSchema,
  CoinsListResponseSchema,
  CoinDetailSchema,
  HistoryResponseSchema,
  CoinTickersResponseSchema,
  MarketChartResponseSchema,
  MarketChartRangeResponseSchema,
  OhlcResponseSchema,
  MarketsRowSchema,
  CoinListItemSchema,
} from "./schemas.js";

/** Type for `GET /coins/markets` response. */
export type MarketsResponse = z.infer<typeof MarketsResponseSchema>;
/** Item type for /coins/markets row. */
export type MarketsRow = z.infer<typeof MarketsRowSchema>;

/** Type for `GET /coins/list` response. */
export type CoinsListResponse = z.infer<typeof CoinsListResponseSchema>;
/** Item type for /coins/list row. */
export type CoinListItem = z.infer<typeof CoinListItemSchema>;

/** Type for `GET /coins/{id}` response. */
export type CoinDetail = z.infer<typeof CoinDetailSchema>;

/** Type for `GET /coins/{id}/history` response. */
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;

/** Type for `GET /coins/{id}/tickers` response. */
export type CoinTickersResponse = z.infer<typeof CoinTickersResponseSchema>;

/** Type for `GET /coins/{id}/market_chart` response. */
export type MarketChartResponse = z.infer<typeof MarketChartResponseSchema>;

/** Type for `GET /coins/{id}/market_chart/range` response. */
export type MarketChartRangeResponse = z.infer<typeof MarketChartRangeResponseSchema>;

/** Type for `GET /coins/{id}/ohlc` response. */
export type OhlcResponse = z.infer<typeof OhlcResponseSchema>;
