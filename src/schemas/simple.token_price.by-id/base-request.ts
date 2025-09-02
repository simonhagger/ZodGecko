/**
 * @file src/schemas/simple.token_price.by-id/base-request.ts
 * @module schemas/simple.token_price.by-id/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {
  AssetPlatformId,
  ContractAddress,
  CSList,
  DefaultFalseBoolean,
  PrecisionString,
  VsCurrency,
} from "../_shared/common.js";

/**
 * @endpoint GET /simple/token_price/{id}
 * @summary This endpoint allows you to query one or more token prices using their token contract addresses
 * @description
 * - You may obtain the asset platform and contract address via several ways:
 *   - refer to "/asset_platforms".
 *   - refer to respective coin page and find ‘contract address’.
 *   - refer to to "/coins/list" endpoint (include platform = true).
 * - You may flag to include more data such as market cap, 24hr volume, 24hr change, last updated time etc.
 * - The endpoint returns the global average price of the coin that is aggregated across all active exchanges on CoinGecko.
 * @param id (required string) see: "/asset_platforms"
 * @param contract_addresses (required string) comma-separated if querying more than 1 contract address.
 * @param vs_currencies (required string) comma-separated if querying more than 1 currency. Refers to "/simple/supported_vs_currencies".
 * @param include_market_cap (optional boolean) default=false
 * @param include_24hr_vol (optional boolean) default=false
 * @param include_24hr_change (optional boolean) default=false
 * @param include_last_updated_at (optional boolean) default=false
 * @param precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const baseRequestSchema = z
  .object({
    id: AssetPlatformId,
    contract_addresses: ContractAddress,
    vs_currencies: CSList(VsCurrency),
    include_market_cap: DefaultFalseBoolean,
    include_24hr_vol: DefaultFalseBoolean,
    include_24hr_change: DefaultFalseBoolean,
    include_last_updated_at: DefaultFalseBoolean,
    precision: PrecisionString.optional(),
  })
  .strict();
