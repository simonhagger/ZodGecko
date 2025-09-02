/**
 * @file src/schemas/coins.by-id.history/base-request.ts
 * @module schemas/coins.by-id.history/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {
  CoinId,
  ContractAddress,
  PrecisionString,
  UnixSec,
  VsCurrency,
} from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}/history
 * @summary This endpoint allows you to query the historical data (price, market cap, 24hrs volume, ...) at a given date for a coin based on a particular coin ID
 * @description
 * - The data returned is at 00:00:00 UTC.
 * - The last completed UTC day (00:00) is available 35 minutes after midnight on the next UTC day (00:35).
 * - Access to historical data via the Public API is restricted to the past 365 days only.
 * @param id (required string) The ID of the coin to query
 * @param contract_address (required string)
 * @param vs_currency (required string) see: "simple/supported_vs_currencies" endpoint
 * @param from (required integer) as UNIX timestamp
 * @param to (required integer) as UNIX timestamp
 * @param precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    contract_address: ContractAddress,
    vs_currency: VsCurrency,
    from: UnixSec,
    to: UnixSec,
    precision: PrecisionString.optional(),
  })
  .strict();
