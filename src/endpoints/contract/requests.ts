/**
 * @file src/endpoints/contract/requests.ts
 * @module contract.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  ContractCoinRequestSchema,
  ContractMarketChartRequestSchema,
  ContractMarketChartRangeRequestSchema,
} from "./schemas.js";

export type ContractCoinRequest = z.infer<typeof ContractCoinRequestSchema>;
export type ContractMarketChartRequest = z.infer<typeof ContractMarketChartRequestSchema>;
export type ContractMarketChartRangeRequest = z.infer<typeof ContractMarketChartRangeRequestSchema>;
