/**
 * @file src/schemas/simple.price/base-request.ts
 * @module schemas/simple.price/base-request
  * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {
  CoinIdOrCoinIds,
  CoinNameOrCoinNames,
  CoinSymbolOrCoinSymbols,
  CSList,
  DefaultFalseBoolean,
  IncludeTokens,
  PrecisionString,
  VsCurrencyList,
} from "../_shared/common.js";

/**
 * @endpoint GET /simple/price
 * @summary This endpoint allows you to query the prices of one or more coins by using their unique Coin API IDs
 * @description
 * - You may obtain the coin ID (API ID) via several ways:
 *   - refer to respective coin page and find ‘API ID’.
 *   - refer to /coins/list endpoint.
 *   - refer to Google Sheets (see CoinGecko site for link).
 * - You can retrieve specific coins using their unique ids, names, or symbols.
 * - You may flag to include more data such as market cap, 24hr volume, 24hr change, last updated time etc.
 * - To verify if a price is stale, you may flag include_last_updated_at=true in your request to obtain the latest updated time. Alternatively, you may flag include_24hr_change=true to determine if it returns a null value.
 * @param vs_currencies (required string) see: "/simple/supported_vs_currencies"
 * @param ids (optional string [Coin ID]) comma-separated if querying more than 1 coin (refers to /coins/list).
 * @param names (optional string [Coin Name]) comma-separated if querying more than 1 coin (refers to /coins/list).
 * @param symbols (optional string [Coin Symbol]) comma-separated if querying more than 1 coin (refers to /coins/list).
 * @param include_tokens (optional string ["top","all"]) default="top"
 * @param include_market_cap (optional boolean) default=false
 * @param include_24hr_vol (optional boolean) default=false
 * @param include_24hr_change (optional boolean) default=false
 * @param include_last_updated_at (optional boolean) default=false
 * @param precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const baseRequestSchema = z
  .object({
    vs_currencies: VsCurrencyList,
    ids: CSList(CoinIdOrCoinIds).optional(),
    names: CSList(CoinNameOrCoinNames).optional(),
    symbols: CSList(CoinSymbolOrCoinSymbols).optional(),
    include_tokens: IncludeTokens.default("top"),
    include_market_cap: DefaultFalseBoolean,
    include_24hr_vol: DefaultFalseBoolean,
    include_24hr_change: DefaultFalseBoolean,
    include_last_updated_at: DefaultFalseBoolean,
    precision: PrecisionString.optional(),
  })
  .strict();
