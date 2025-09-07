/**
 * @file src/schemas/coins.by-id.ohlc/base-response.ts
 * @module schemas/coins.by-id.ohlc/base-response
 * @summary Base Response.
 */

/** Schema building types */
// import z from "zod";

/** Shared imports */
import { OhlcSeries } from "../_shared/common.js";

/**
 * CoinGecko API response for /coins/{id}/ohlc endpoint.
 */
export const baseResponseSchema = OhlcSeries;
