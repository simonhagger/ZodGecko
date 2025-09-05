/**
 * @file src/schemas/coins.by-id.market_chart/base-response.ts
 * @module schemas/coins.by-id.market_chart/base-response
  * @summary Base Response.
 */

/** Schema building types */
// import z from "zod";

/** Shared imports */
import { MarketChart } from "../_shared/common.js";

/**
 * CoinGecko API response for /coins/{id}/market_chart endpoint.
 */
export const baseResponseSchema = MarketChart;
