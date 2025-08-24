/**
 * @file src/endpoints/contract/index.ts
 * @module contract
 *
 * Public surface for the Contract endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `contract.schemas`.
 */

export type {
  ContractCoinRequest,
  ContractMarketChartRequest,
  ContractMarketChartRangeRequest,
} from "./requests.js";

export type {
  ContractCoinResponse,
  ContractMarketChartResponse,
  ContractMarketChartRangeResponse,
} from "./responses.js";

export * as schemas from "./schemas.js";
