/**
 * @file src/endpoints/exchanges/index.ts
 * @module exchanges
 *
 * Public surface for the Exchanges endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `exchanges.schemas`.
 */

export type {
  ExchangesRequest,
  ExchangesListRequest,
  ExchangeByIdRequest,
  ExchangeTickersRequest,
  ExchangeVolumeChartRequest,
} from "./requests.js";

export type {
  ExchangesResponse,
  ExchangesListResponse,
  ExchangeByIdResponse,
  ExchangeTickersResponse,
  ExchangeVolumeChartResponse,
  ExchangeRow,
  ExchangesListItem,
} from "./responses.js";

export * as schemas from "./schemas.js";
