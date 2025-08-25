/**
 * @file src/endpoints/contract/index.ts
 * @module contract
 *
 * Public surface for the Contract endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `contract.schemas`.
 */

export type {
  CoinsByIdContractByAddressRequest,
  CoinsByIdContractByAddressMarketChartRequest,
  CoinsByIdContractByAddressMarketChartRangeRequest,
} from "./requests.js";

export type {
  CoinsByIdContractByAddressResponse,
  CoinsByIdContractByAddressMarketChartResponse,
  CoinsByIdContractByAddressMarketChartRangeResponse,
} from "./responses.js";

export * as schemas from "./schemas.js";
