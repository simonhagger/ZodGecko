/**
 * @file src/schemas/coins.by-id.ohlc/base-request.ts
 * @module schemas/coins.by-id.ohlc/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { CoinId, OhlcDays, PrecisionString, VsCurrency } from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}/ohlc
 * @summary This endpoint allows you to query the coin tickers on both centralized exchange (CEX) and decentralized exchange (DEX) based on a particular coin ID
 * @description
 * - You may obtain the coin ID (API ID) via several ways:
 *   - reference respective coin page and find ‘API ID’;
 *   - refer to "/coins/list" endpoint;
 *   - refer to google sheets (on CoinGecko site).
 * - You may specify the exchange_ids if you want to retrieve tickers for specific exchange only. See "/exchanges" endpoint.
 * - You may include values such as page to specify which page of responses you would like to show.
 * - You may also flag to include more data such as exchange logo and depth.
 * - The timestamp displayed in the payload (response) indicates the end (or close) time of the OHLC data.
 * - Data granularity (candle's body) is automatic:
 *   - 1 - 2 days: 30 minutes;
 *   - 3 - 30 days: 4 hours;
 *   - 31 days and beyond: 4 days.
 * - Note: Access to historical data via the Public API is restricted to the past 365 days only.
 * @param id (required string) see: "/coins/list"
 * @param vs_currency (required string) see: "simple/supported_vs_currencies" endpoint
 * @param days (required string ["1","7","14","30","90","180","365"])
 * @param precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    vs_currency: VsCurrency,
    days: OhlcDays,
    precision: PrecisionString.optional(),
  })
  .strict();
