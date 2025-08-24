/**
 * @file src/endpoints/contract/responses.ts
 * @module contract.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  ContractCoinResponseSchema,
  ContractMarketChartResponseSchema,
  ContractMarketChartRangeResponseSchema,
} from "./schemas.js";

export type ContractCoinResponse = z.infer<typeof ContractCoinResponseSchema>;
export type ContractMarketChartResponse = z.infer<typeof ContractMarketChartResponseSchema>;
export type ContractMarketChartRangeResponse = z.infer<
  typeof ContractMarketChartRangeResponseSchema
>;
