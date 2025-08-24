/**
 * @file src/endpoints/contract/schemas.ts
 * @module contract.schemas
 *
 * Zod schemas for the Contract endpoint group.
 * Covers:
 *   - GET /coins/{id}/contract/{contract_address}
 *   - GET /coins/{id}/contract/{contract_address}/market_chart
 *   - GET /coins/{id}/contract/{contract_address}/market_chart/range
 *
 * Notes
 * - All requests require a parent `coin_id` and a `contract_address`.
 * - Contract address validation is tolerant to handle non-EVM chains.
 * - Market chart schemas reuse shared time-series fragments.
 */

import { z } from "zod";

import {
  tolerantObject,
  MarketChart,
  TsSeries,
  CoinId,
  ContractAddress,
  VsCurrency,
  UnixSec,
} from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/** GET /coins/{id}/contract/{contract_address} */
export const ContractCoinRequestSchema = z
  .object({
    id: CoinId,
    contract_address: ContractAddress,
  })
  .strict();

/** GET /coins/{id}/contract/{contract_address}/market_chart */
export const ContractMarketChartRequestSchema = z
  .object({
    id: CoinId,
    contract_address: ContractAddress,
    vs_currency: VsCurrency,
    days: z.union([z.string(), z.number()]),
  })
  .strict();

/** GET /coins/{id}/contract/{contract_address}/market_chart/range */
export const ContractMarketChartRangeRequestSchema = z
  .object({
    id: CoinId,
    contract_address: ContractAddress,
    vs_currency: VsCurrency,
    from: UnixSec,
    to: UnixSec,
  })
  .strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/** Response shape for GET /coins/{id}/contract/{contract_address} */
export const ContractCoinResponseSchema = tolerantObject({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
});

/** Response shape for GET /coins/{id}/contract/{contract_address}/market_chart */
export const ContractMarketChartResponseSchema = MarketChart;

/** Response shape for GET /coins/{id}/contract/{contract_address}/market_chart/range */
export const ContractMarketChartRangeResponseSchema = tolerantObject({
  prices: TsSeries.optional(),
  market_caps: TsSeries.optional(),
  total_volumes: TsSeries.optional(),
});
