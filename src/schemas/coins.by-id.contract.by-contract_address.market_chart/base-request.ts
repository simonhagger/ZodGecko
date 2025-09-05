/**
 * @file src/schemas/coins.by-id.contract.by-contract_address.market_chart/base-request.ts
 * @module schemas/coins.by-id.contract.by-contract_address.market_chart/base-request
  * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { CoercedNumberToString, CoinId, ContractAddress, VsCurrency } from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}/contract/{contract_id}/market_chart
 * @summary This endpoint allows you to get the historical chart data including time in UNIX, price, market cap and 24hr volume based on asset platform and particular token contract address
 * @description Fetches price data for a number of historical days, NOTE: access to historical data via the Public API is restricted to the past 365 days only.
 * @param id (required string) The ID of the coin to query
 * @param contract_address (required string)
 * @param vs_currency (required string) see: "simple/supported_vs_currencies" endpoint
 * @param days (required string)
 */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    contract_address: ContractAddress,
    vs_currency: VsCurrency,
    days: CoercedNumberToString,
  })
  .strict();
