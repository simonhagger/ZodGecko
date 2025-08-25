/**
 * @file src/endpoints/coins/index.ts
 * @module coins
 *
 * Public surface for the Coins endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `coins.schemas`.
 */

export type {
  CoinsMarketsRequest,
  CoinsListRequest,
  CoinsByIdRequest,
  CoinsByIdHistoryRequest,
  CoinsByIdTickersRequest,
  CoinsByIdMarketChartRequest,
  CoinsByIdMarketChartRangeRequest,
  CoinsByIdOhlcRequest,
} from "./requests.js";

export type {
  CoinsMarketsResponse,
  CoinsListResponse,
  CoinsByIdResponse,
  CoinsByIdHistoryResponse,
  CoinsByIdTickersResponse,
  CoinsByIdMarketChartResponse,
  CoinsByIdMarketChartRangeResponse,
  CoinsByIdOhlcResponse,
  CoinsMarketsRow,
  CoinsListItem,
} from "./responses.js";

export * as schemas from "./schemas.js";
