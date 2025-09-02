/**
 * @file src/endpoints/contract/responses.ts
 * @module contract.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  CoinsByIdContractByAddressResponseSchema,
  CoinsByIdContractByAddressMarketChartResponseSchema,
  CoinsByIdContractByAddressMarketChartRangeResponseSchema,
} from "./schemas.js";

/** Type for `GET /coins/{id}/contract/{contract_address}` response. */
export type CoinsByIdContractByAddressResponse = z.infer<
  typeof CoinsByIdContractByAddressResponseSchema
>;
/** Type for `GET /coins/{id}/contract/{contract_address}/market_chart` response. */
export type CoinsByIdContractByAddressMarketChartResponse = z.infer<
  typeof CoinsByIdContractByAddressMarketChartResponseSchema
>;
/** Type for `GET /coins/{id}/contract/{contract_address}/market_chart/range` response. */
export type CoinsByIdContractByAddressMarketChartRangeResponse = z.infer<
  typeof CoinsByIdContractByAddressMarketChartRangeResponseSchema
>;
