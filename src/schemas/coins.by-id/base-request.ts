/**
 * @file src/schemas/coins.by-id/base-request.ts
 * @module schemas/coins.by-id/base-request
  * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {
  CoinId,
  DefaultFalseBoolean,
  DefaultTrueBoolean,
  DexPairFormat,
} from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}
 * @summary This endpoint allows you to query all the metadata (image, websites, socials, description, contract address, etc.) and market data (price, ATH, exchange tickers, etc.) of a coin from the CoinGecko coin page based on a particular coin ID
 * @description Fetches comprehensive information about a specific coin, including its market data, community statistics, developer activity, and public interest metrics. Various boolean flags allow you to include or exclude specific sections of data in the response.
 * @param id (required string) The ID of the coin to query
 * @param localization (optional boolean) default=true
 * @param tickers (optional boolean) default=true
 * @param market_data (optional boolean) default=true
 * @param community_data (optional boolean) default=true
 * @param developer_data (optional boolean) default=true
 * @param sparkline (optional boolean) default=false
 * @param dex_pair_format (optional string ["contract_address", "symbol"])
 */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    localization: DefaultTrueBoolean,
    tickers: DefaultTrueBoolean,
    market_data: DefaultTrueBoolean,
    community_data: DefaultTrueBoolean,
    developer_data: DefaultTrueBoolean,
    sparkline: DefaultFalseBoolean,
    dex_pair_format: DexPairFormat.optional(),
  })
  .strict();
