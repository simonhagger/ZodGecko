/**
 * @file src/schemas/coins.by-id.contract.by-contract_address.market_chart/base-response.ts
 * @module schemas/coins.by-id.contract.by-contract_address.market_chart/base-response
  * @summary Base Response.
 */

/** Schema building types */
import { MarketChart } from "../_shared/common.js";

/**
 * CoinGecko API response for /coins/{id}/contract/{contract_address}/market_chart endpoint.
 */
export const baseResponseSchema = MarketChart;
