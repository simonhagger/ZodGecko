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

export type CoinsByIdContractByAddressRequest = z.infer<
  typeof CoinsByIdContractByAddressRequestSchema
>;
export type CoinsByIdContractByAddressMarketChartRequest = z.infer<
  typeof CoinsByIdContractByAddressMarketChartRequestSchema
>;
export type CoinsByIdContractByAddressMarketChartRangeRequest = z.infer<
  typeof CoinsByIdContractByAddressMarketChartRangeRequestSchema
>;
