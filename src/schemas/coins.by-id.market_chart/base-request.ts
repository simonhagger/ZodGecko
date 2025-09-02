/**
 * @file src/schemas/coins.by-id.market_chart/base-request.ts
 * @module schemas/coins.by-id.market_chart/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {
  CoinId,
  DailyInterval,
  OneToThreeSixtyFiveString,
  PrecisionString,
  VsCurrency,
} from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}/market_chart
 * @summary This endpoint allows you to query the historical data (price, market cap, 24hrs volume, ...) at a given date for a coin based on a particular coin ID
 * @description
 * - You may obtain the coin ID (API ID) via several ways:
 *   - reference respective coin page and find ‘API ID’;
 *   - refer to "/coins/list" endpoint;
 *   - refer to google sheets (on CoinGecko site).
 * - You may use tools like epoch converter to convert human readable date to UNIX timestamp.
 * - You may leave the interval as empty for automatic granularity:
 *   - 1 day from current time = 5-minutely data;
 *   - 2 - 90 days from current time = hourly data;
 *   - above 90 days from current time = daily data (00:00 UTC).
 *  - Note: Access to historical data via the Public API is restricted to the past 365 days only.
 * @param id (required string) The ID of the coin to query
 * @param vs_currency (required string) see: "simple/supported_vs_currencies" endpoint
 * @param days (required integer as string)
 * @param interval (optional string ["daily"]) Note: There is only this option available for now
 * @param precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    vs_currency: VsCurrency,
    days: OneToThreeSixtyFiveString,
    interval: DailyInterval.optional(),
    precision: PrecisionString.optional(),
  })
  .strict();
