/**
 * @file src/endpoints/contract/requests.ts
 * @module contract.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  CoinsByIdContractByAddressRequestSchema,
  CoinsByIdContractByAddressMarketChartRequestSchema,
  CoinsByIdContractByAddressMarketChartRangeRequestSchema,
} from "./schemas.js";

/** Type for `GET /coins/{id}/contract/{contract_address}` request. */
export type CoinsByIdContractByAddressRequest = z.infer<
  typeof CoinsByIdContractByAddressRequestSchema
>;
/** Type for `GET /coins/{id}/contract/{contract_address}/market_chart` request. */
export type CoinsByIdContractByAddressMarketChartRequest = z.infer<
  typeof CoinsByIdContractByAddressMarketChartRequestSchema
>;
/** Type for `GET /coins/{id}/contract/{contract_address}/market_chart/range` request. */
export type CoinsByIdContractByAddressMarketChartRangeRequest = z.infer<
  typeof CoinsByIdContractByAddressMarketChartRangeRequestSchema
>;
