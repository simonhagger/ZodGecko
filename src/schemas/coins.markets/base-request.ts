/**
 * @file src/schemas/coins.markets/base-request.ts
 * @module schemas/coins.markets/base-request
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
  MarketsLocale,
  MarketsOrder,
  NonEmptyString,
  PageOnly,
  PerPageOnly,
  PrecisionString,
  PriceChangeWindows,
  VsCurrency,
} from "../_shared/common.js";

/**
 * @endpoint GET /coins/markets
 * @summary This endpoint allows you to query all the supported coins with price, market cap, volume and market related data
 * @description Fetches market data (price, market cap, volume) for multiple coins listed on CoinGecko. You can filter results by currency, coin IDs, categories, and other parameters. Results are paginated and can be sorted by various metrics.
 * @param vs_currency (required string) see: /simple/supported_vs_currencies
 * @param ids (Coin Id or multiple Coin Id strings separated by commas) see: /coins/list
 * @param names (Coin Name or multiple Coin Name strings separated by commas) see: /coins/list
 * @param symbols (Coin Symbol or multiple Coin Symbol strings separated by commas) see: /coins/list
 * @param include_tokens (optional string ["top|all"]) default="top"
 * @param category (optional string) see: /coins/categories/list
 * @param order (optional string ["market_cap_asc","market_cap_desc","volume_asc","volume_desc","id_asc","id_desc"]) default="market_cap_desc"
 * @param per_page (optional integer [1..250]) default=100
 * @param page (optional integer) default=1
 * @param sparkline (optional boolean) default=false
 * @param price_change_percentage (optional string) ["1h","24h","7d","14d","30d","60d","200d","1y"] default="24h"
 * @param locale (optional string) ["ar","bg","cs","da","de","el","en","es","fi","fr","he","hi","hr","hu","id","it","ja","ko","lt","nl","no","pl","pt","ro","ru","sk","sl","sv","th","tr","uk","vi","zh","zh-tw"] default="en"
 * @param precision (optional string) ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"] NOTE: default is empty for auto precision
 */
export const baseRequestSchema = z
  .object({
    vs_currency: VsCurrency,
    ids: CoinIdOrCoinIds.optional(),
    names: CoinNameOrCoinNames.optional(),
    symbols: CoinSymbolOrCoinSymbols.optional(),
    include_tokens: IncludeTokens.default("top"),
    category: NonEmptyString.optional(),
    order: MarketsOrder.default("market_cap_desc"),
    per_page: PerPageOnly.default(100),
    page: PageOnly.default(1),
    sparkline: DefaultFalseBoolean,
    price_change_percentage: CSList(PriceChangeWindows).optional(),
    locale: MarketsLocale.default("en"),
    precision: PrecisionString.optional(),
  })
  .strict();
