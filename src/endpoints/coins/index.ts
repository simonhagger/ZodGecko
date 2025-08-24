/**
 * @file src/endpoints/coins/index.ts
 * @module coins
 *
 * Public surface for the Coins endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `coins.schemas`.
 */

export type {
  MarketsRequest,
  CoinsListRequest,
  CoinDetailRequest,
  HistoryRequest,
  CoinTickersRequest,
  MarketChartRequest,
  MarketChartRangeRequest,
  OhlcRequest,
} from "./requests.js";

export type {
  MarketsResponse,
  CoinsListResponse,
  CoinDetail,
  HistoryResponse,
  CoinTickersResponse,
  MarketChartResponse,
  MarketChartRangeResponse,
  OhlcResponse,
  MarketsRow,
  CoinListItem,
} from "./responses.js";

export * as schemas from "./schemas.js";
