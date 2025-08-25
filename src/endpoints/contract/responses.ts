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

export type CoinsByIdContractByAddressResponse = z.infer<
  typeof CoinsByIdContractByAddressResponseSchema
>;
export type CoinsByIdContractByAddressMarketChartResponse = z.infer<
  typeof CoinsByIdContractByAddressMarketChartResponseSchema
>;
export type CoinsByIdContractByAddressMarketChartRangeResponse = z.infer<
  typeof CoinsByIdContractByAddressMarketChartRangeResponseSchema
>;
