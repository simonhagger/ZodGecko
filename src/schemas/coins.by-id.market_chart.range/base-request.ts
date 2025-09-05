/**
 * @file src/schemas/coins.by-id.market_chart.range/base-request.ts
 * @module schemas/coins.by-id.market_chart.range/base-request
  * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { CoinId, PrecisionString, UnixSec, VsCurrency } from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}/market_chart/range
 * @summary This endpoint allows you to get the historical chart data of a coin within certain time range in UNIX along with price, market cap and 24hr volume based on particular coin ID
 * @description
 * - You may obtain the coin ID (API ID) via several ways:
 *   - reference respective coin page and find ‘API ID’;
 *   - refer to "/coins/list" endpoint;
 *   - refer to google sheets (on CoinGecko site).
 * - You may leave the interval params as empty for automatic granularity:
 *   - 1 day from current time = 5-minutely data;
 *   - 1 day from any time (except current time) = hourly data;
 *   - 2 - 90 days from any time = hourly data;
 *   - above 90 days from any time = daily data (00:00 UTC).
 * - Note: Access to historical data via the Public API is restricted to the past 365 days only.
 * @param id (required string) The ID of the coin to query
 * @param vs_currency (required string) see: "simple/supported_vs_currencies" endpoint
 * @param from (required integer) UNIX timestamp of the start of the date range
 * @param to (required integer) UNIX timestamp of the end of the date range
 * @param precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    vs_currency: VsCurrency,
    from: UnixSec,
    to: UnixSec,
    precision: PrecisionString.optional(),
  })
  .strict();
