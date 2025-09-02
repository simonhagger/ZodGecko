/**
 * @file src/schemas/coins.by-id.contract.by-contract_address.market_chart.range/base-request.ts
 * @module schemas/coins.by-id.contract.by-contract_address.market_chart.range/base
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
 * @endpoint GET /coins/{id}/contract/{contract_id}/market_chart/range
 * @summary This endpoint allows you to get the historical chart data within certain time range in UNIX along with price, market cap and 24hr volume based on asset platform and particular token contract address
 * @description Fetches price data for a given interval of historical days, NOTE: access to historical data via the Public API is restricted to the past 365 days only.
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
