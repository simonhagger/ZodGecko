/**
 * @file Runtime endpoint registry (string-literal union + helpers)
 * @summary Central list of supported CoinGecko API paths used by runtime helpers,
 *          tests, and docs. Keeps path strings typo-free and discoverable.
 * @remarks
 * - Keep this list in sync with the endpoints you actually expose.
 * - Templated segments use `{param}` braces (e.g. `/coins/{id}`).
 * - This is synced to the order here: https://docs.coingecko.com/v3.0.1/reference/endpoint-overview
 */

import type { z } from "zod";

// ✅ import directly from endpoint modules to avoid barrels/cycles
import * as assetPlatformsNS from "../endpoints/asset-platforms/index.js";
import * as categoriesNS from "../endpoints/categories/index.js";
import * as coinsNS from "../endpoints/coins/index.js";
import * as companiesNS from "../endpoints/companies/index.js";
import * as contractNS from "../endpoints/contract/index.js";
import * as derivativesNS from "../endpoints/derivatives/index.js";
import * as exchangesNS from "../endpoints/exchanges/index.js";
import * as globalNS from "../endpoints/global/index.js";
import * as pingNS from "../endpoints/ping/index.js";
import * as searchNS from "../endpoints/search/index.js";
import * as simpleNS from "../endpoints/simple/index.js";

/** Internal: shape stored per endpoint in the registry. */
type Entry = { req: z.ZodTypeAny; res: z.ZodTypeAny };

/**
 * Central mapping from endpoint → { req, res } schemas.
 */
export const ENDPOINTS = {
  // --- ping endpoint
  "/ping": {
    req: pingNS.schemas.PingRequestSchema,
    res: pingNS.schemas.PingResponseSchema,
  },
  // --- simple endpoint
  "/simple/price": {
    req: simpleNS.schemas.SimplePriceRequestSchema,
    res: simpleNS.schemas.SimplePriceResponseSchema,
  },
  "/simple/token_price/{id}": {
    req: simpleNS.schemas.SimpleTokenPriceByIdRequestSchema,
    res: simpleNS.schemas.SimpleTokenPriceByIdResponseSchema,
  },
  "/simple/supported_vs_currencies": {
    req: simpleNS.schemas.SimpleSupportedVsCurrenciesRequestSchema,
    res: simpleNS.schemas.SimpleSupportedVsCurrenciesResponseSchema,
  },

  // --- coins endpoint (including specialist endpoints)
  "/coins/list": {
    req: coinsNS.schemas.CoinsListRequestSchema,
    res: coinsNS.schemas.CoinsListResponseSchema,
  },
  "/coins/markets": {
    req: coinsNS.schemas.CoinsMarketsRequestSchema,
    res: coinsNS.schemas.CoinsMarketsResponseSchema,
  },
  "/coins/{id}": {
    req: coinsNS.schemas.CoinsByIdRequestSchema,
    res: coinsNS.schemas.CoinsByIdResponseSchema,
  },
  "/coins/{id}/tickers": {
    req: coinsNS.schemas.CoinsByIdTickersRequestSchema,
    res: coinsNS.schemas.CoinsByIdTickersResponseSchema,
  },
  "/coins/{id}/history": {
    req: coinsNS.schemas.CoinsByIdHistoryRequestSchema,
    res: coinsNS.schemas.CoinsByIdHistoryResponseSchema,
  },
  "/coins/{id}/market_chart": {
    req: coinsNS.schemas.CoinsByIdMarketChartRequestSchema,
    res: coinsNS.schemas.CoinsByIdMarketChartResponseSchema,
  },
  "/coins/{id}/market_chart/range": {
    req: coinsNS.schemas.CoinsByIdMarketChartRangeRequestSchema,
    res: coinsNS.schemas.CoinsByIdMarketChartRangeResponseSchema,
  },
  "/coins/{id}/ohlc": {
    req: coinsNS.schemas.CoinsByIdOhlcRequestSchema,
    res: coinsNS.schemas.CoinsByIdOhlcResponseSchema,
  },
  // contract endpoints
  "/coins/{id}/contract/{contract_address}": {
    req: contractNS.schemas.CoinsByIdContractByAddressRequestSchema,
    res: contractNS.schemas.CoinsByIdContractByAddressResponseSchema,
  },
  "/coins/{id}/contract/{contract_address}/market_chart": {
    req: contractNS.schemas.CoinsByIdContractByAddressMarketChartRequestSchema,
    res: contractNS.schemas.CoinsByIdContractByAddressMarketChartResponseSchema,
  },
  "/coins/{id}/contract/{contract_address}/market_chart/range": {
    req: contractNS.schemas.CoinsByIdContractByAddressMarketChartRangeRequestSchema,
    res: contractNS.schemas.CoinsByIdContractByAddressMarketChartRangeResponseSchema,
  },
  // categories endpoints
  "/coins/categories/list": {
    req: categoriesNS.schemas.CoinsCategoriesListRequestSchema,
    res: categoriesNS.schemas.CoinsCategoriesListResponseSchema,
  },
  "/coins/categories": {
    req: categoriesNS.schemas.CoinsCategoriesRequestSchema,
    res: categoriesNS.schemas.CoinsCategoriesResponseSchema,
  },

  // --- exchanges endpoints
  "/exchanges": {
    req: exchangesNS.schemas.ExchangesRequestSchema,
    res: exchangesNS.schemas.ExchangesResponseSchema,
  },
  "/exchanges/list": {
    req: exchangesNS.schemas.ExchangesListRequestSchema,
    res: exchangesNS.schemas.ExchangesListResponseSchema,
  },
  "/exchanges/{id}": {
    req: exchangesNS.schemas.ExchangesByIdRequestSchema,
    res: exchangesNS.schemas.ExchangesByIdResponseSchema,
  },
  "/exchanges/{id}/tickers": {
    req: exchangesNS.schemas.ExchangesByIdTickersRequestSchema,
    res: exchangesNS.schemas.ExchangesByIdTickersResponseSchema,
  },
  "/exchanges/{id}/volume_chart": {
    req: exchangesNS.schemas.ExchangesByIdVolumeChartRequestSchema,
    res: exchangesNS.schemas.ExchangesByIdVolumeChartResponseSchema,
  },
  // --- derivatives endpoints
  "/derivatives": {
    req: derivativesNS.schemas.DerivativesRequestSchema,
    res: derivativesNS.schemas.DerivativesResponseSchema,
  },
  "/derivatives/exchanges": {
    req: derivativesNS.schemas.DerivativesExchangesRequestSchema,
    res: derivativesNS.schemas.DerivativesExchangesResponseSchema,
  },
  "/derivatives/exchanges/{id}": {
    req: derivativesNS.schemas.DerivativesExchangesByIdRequestSchema,
    res: derivativesNS.schemas.DerivativesExchangesByIdResponseSchema,
  },
  "/derivatives/exchanges/list": {
    req: derivativesNS.schemas.DerivativesExchangesListRequestSchema,
    res: derivativesNS.schemas.DerivativesExchangesListResponseSchema,
  },
  // exchange rates endpoints NOT YET IMPLEMENTED
  // "/exchange_rates": {
  //   req: exchangeRates.schemas.ExchangeRatesRequestSchema,
  //   res: exchangeRates.schemas.ExchangeRatesResponseSchema,
  // },
  // --- asset-platforms endpoint
  "/asset_platforms": {
    req: assetPlatformsNS.schemas.AssetPlatformsRequestSchema,
    res: assetPlatformsNS.schemas.AssetPlatformsResponseSchema,
  },
  // token lists endpoints NOT YET IMPLEMENTED
  // "/token_lists/{asset_platform_id}/all.json": {
  //   req: tokenLists.schemas.TokenListsByAssetPlatformIdRequestSchema,
  //   res: tokenLists.schemas.TokenListsByAssetPlatformIdResponseSchema,
  // },
  // --- search endpoints
  "/search": {
    req: searchNS.schemas.SearchRequestSchema,
    res: searchNS.schemas.SearchResponseSchema,
  },
  "/search/trending": {
    req: searchNS.schemas.SearchTrendingRequestSchema,
    res: searchNS.schemas.SearchTrendingResponseSchema,
  },
  // --- global endpoints
  "/global": {
    req: globalNS.schemas.GlobalRequestSchema,
    res: globalNS.schemas.GlobalResponseSchema,
  },
  "/global/decentralized_finance_defi": {
    req: globalNS.schemas.GlobalDefiRequestSchema,
    res: globalNS.schemas.GlobalDefiResponseSchema,
  },
  // companies (public treasury) endpoints
  "/companies/public_treasury/{coin_id}": {
    req: companiesNS.schemas.CompaniesPublicTreasuryByIdRequestSchema,
    res: companiesNS.schemas.CompaniesPublicTreasuryByIdResponseSchema,
  },
} as const satisfies Record<string, Entry>;

export type Endpoint = keyof typeof ENDPOINTS;

// Optional: a frozen runtime list if you need to iterate in code/tests
export const ALL_ENDPOINTS = Object.freeze(Object.keys(ENDPOINTS) as Endpoint[]);

/** Zod request schema type for a given endpoint key. */
export type RequestSchemaOf<E extends Endpoint> = (typeof ENDPOINTS)[E]["req"];
/** Zod response schema type for a given endpoint key. */
export type ResponseSchemaOf<E extends Endpoint> = (typeof ENDPOINTS)[E]["res"];

/** Get the request schema for a specific endpoint key. */
export function getRequestSchema<E extends Endpoint>(ep: E): RequestSchemaOf<E> {
  return ENDPOINTS[ep].req as RequestSchemaOf<E>;
}

/** Get the response schema for a specific endpoint key. */
export function getResponseSchema<E extends Endpoint>(ep: E): ResponseSchemaOf<E> {
  return ENDPOINTS[ep].res as ResponseSchemaOf<E>;
}

/** Convenience: get both schemas at once with precise typing. */
export function getSchemas<E extends Endpoint>(
  ep: E,
): {
  req: RequestSchemaOf<E>;
  res: ResponseSchemaOf<E>;
} {
  const entry = ENDPOINTS[ep];
  return {
    req: entry.req as RequestSchemaOf<E>,
    res: entry.res as ResponseSchemaOf<E>,
  };
}
