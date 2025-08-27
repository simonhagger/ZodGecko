/**
 * @file Runtime endpoint registry (string-literal union + helpers)
 * @summary Central list of supported CoinGecko API paths used by runtime helpers, tests, and docs.
 * @remarks
 * - Keep this list in sync with the endpoints you actually expose.
 * - Templated segments use `{param}` braces (e.g. `/coins/{id}`).
 * - Order mirrors the API docs: https://docs.coingecko.com/v3.0.1/reference/endpoint-overview
 */

import type { ZodType } from "zod";

// Import directly from endpoint modules to avoid barrels/cycles.
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

/** Schema accessors stored per endpoint (lazy to avoid eager module eval). */
/** @internal – do not export or re-export */
type SchemaThunks = {
  req: () => ZodType<unknown>;
  res: () => ZodType<unknown>;
};

/**
 * Central mapping from endpoint → schema thunks.
 * Values are thunks so modules aren’t dereferenced at import time.
 */
const ENDPOINTS = {
  // --- ping
  "/ping": {
    req: () => pingNS.schemas.PingRequestSchema,
    res: () => pingNS.schemas.PingResponseSchema,
  },

  // --- simple
  "/simple/price": {
    req: () => simpleNS.schemas.SimplePriceRequestSchema,
    res: () => simpleNS.schemas.SimplePriceResponseSchema,
  },
  "/simple/token_price/{id}": {
    req: () => simpleNS.schemas.SimpleTokenPriceByIdRequestSchema,
    res: () => simpleNS.schemas.SimpleTokenPriceByIdResponseSchema,
  },
  "/simple/supported_vs_currencies": {
    req: () => simpleNS.schemas.SimpleSupportedVsCurrenciesRequestSchema,
    res: () => simpleNS.schemas.SimpleSupportedVsCurrenciesResponseSchema,
  },

  // --- coins (incl. specialist endpoints)
  "/coins/list": {
    req: () => coinsNS.schemas.CoinsListRequestSchema,
    res: () => coinsNS.schemas.CoinsListResponseSchema,
  },
  "/coins/markets": {
    req: () => coinsNS.schemas.CoinsMarketsRequestSchema,
    res: () => coinsNS.schemas.CoinsMarketsResponseSchema,
  },
  "/coins/{id}": {
    req: () => coinsNS.schemas.CoinsByIdRequestSchema,
    res: () => coinsNS.schemas.CoinsByIdResponseSchema,
  },
  "/coins/{id}/tickers": {
    req: () => coinsNS.schemas.CoinsByIdTickersRequestSchema,
    res: () => coinsNS.schemas.CoinsByIdTickersResponseSchema,
  },
  "/coins/{id}/history": {
    req: () => coinsNS.schemas.CoinsByIdHistoryRequestSchema,
    res: () => coinsNS.schemas.CoinsByIdHistoryResponseSchema,
  },
  "/coins/{id}/market_chart": {
    req: () => coinsNS.schemas.CoinsByIdMarketChartRequestSchema,
    res: () => coinsNS.schemas.CoinsByIdMarketChartResponseSchema,
  },
  "/coins/{id}/market_chart/range": {
    req: () => coinsNS.schemas.CoinsByIdMarketChartRangeRequestSchema,
    res: () => coinsNS.schemas.CoinsByIdMarketChartRangeResponseSchema,
  },
  "/coins/{id}/ohlc": {
    req: () => coinsNS.schemas.CoinsByIdOhlcRequestSchema,
    res: () => coinsNS.schemas.CoinsByIdOhlcResponseSchema,
  },

  // --- contract
  "/coins/{id}/contract/{contract_address}": {
    req: () => contractNS.schemas.CoinsByIdContractByAddressRequestSchema,
    res: () => contractNS.schemas.CoinsByIdContractByAddressResponseSchema,
  },
  "/coins/{id}/contract/{contract_address}/market_chart": {
    req: () => contractNS.schemas.CoinsByIdContractByAddressMarketChartRequestSchema,
    res: () => contractNS.schemas.CoinsByIdContractByAddressMarketChartResponseSchema,
  },
  "/coins/{id}/contract/{contract_address}/market_chart/range": {
    req: () => contractNS.schemas.CoinsByIdContractByAddressMarketChartRangeRequestSchema,
    res: () => contractNS.schemas.CoinsByIdContractByAddressMarketChartRangeResponseSchema,
  },

  // --- categories
  "/coins/categories/list": {
    req: () => categoriesNS.schemas.CoinsCategoriesListRequestSchema,
    res: () => categoriesNS.schemas.CoinsCategoriesListResponseSchema,
  },
  "/coins/categories": {
    req: () => categoriesNS.schemas.CoinsCategoriesRequestSchema,
    res: () => categoriesNS.schemas.CoinsCategoriesResponseSchema,
  },

  // --- exchanges
  "/exchanges": {
    req: () => exchangesNS.schemas.ExchangesRequestSchema,
    res: () => exchangesNS.schemas.ExchangesResponseSchema,
  },
  "/exchanges/list": {
    req: () => exchangesNS.schemas.ExchangesListRequestSchema,
    res: () => exchangesNS.schemas.ExchangesListResponseSchema,
  },
  "/exchanges/{id}": {
    req: () => exchangesNS.schemas.ExchangesByIdRequestSchema,
    res: () => exchangesNS.schemas.ExchangesByIdResponseSchema,
  },
  "/exchanges/{id}/tickers": {
    req: () => exchangesNS.schemas.ExchangesByIdTickersRequestSchema,
    res: () => exchangesNS.schemas.ExchangesByIdTickersResponseSchema,
  },
  "/exchanges/{id}/volume_chart": {
    req: () => exchangesNS.schemas.ExchangesByIdVolumeChartRequestSchema,
    res: () => exchangesNS.schemas.ExchangesByIdVolumeChartResponseSchema,
  },

  // --- derivatives
  "/derivatives": {
    req: () => derivativesNS.schemas.DerivativesRequestSchema,
    res: () => derivativesNS.schemas.DerivativesResponseSchema,
  },
  "/derivatives/exchanges": {
    req: () => derivativesNS.schemas.DerivativesExchangesRequestSchema,
    res: () => derivativesNS.schemas.DerivativesExchangesResponseSchema,
  },
  "/derivatives/exchanges/{id}": {
    req: () => derivativesNS.schemas.DerivativesExchangesByIdRequestSchema,
    res: () => derivativesNS.schemas.DerivativesExchangesByIdResponseSchema,
  },
  "/derivatives/exchanges/list": {
    req: () => derivativesNS.schemas.DerivativesExchangesListRequestSchema,
    res: () => derivativesNS.schemas.DerivativesExchangesListResponseSchema,
  },

  // --- asset platforms
  "/asset_platforms": {
    req: () => assetPlatformsNS.schemas.AssetPlatformsRequestSchema,
    res: () => assetPlatformsNS.schemas.AssetPlatformsResponseSchema,
  },

  // --- search
  "/search": {
    req: () => searchNS.schemas.SearchRequestSchema,
    res: () => searchNS.schemas.SearchResponseSchema,
  },
  "/search/trending": {
    req: () => searchNS.schemas.SearchTrendingRequestSchema,
    res: () => searchNS.schemas.SearchTrendingResponseSchema,
  },

  // --- global
  "/global": {
    req: () => globalNS.schemas.GlobalRequestSchema,
    res: () => globalNS.schemas.GlobalResponseSchema,
  },
  "/global/decentralized_finance_defi": {
    req: () => globalNS.schemas.GlobalDefiRequestSchema,
    res: () => globalNS.schemas.GlobalDefiResponseSchema,
  },

  // --- companies (public treasury)
  "/companies/public_treasury/{coin_id}": {
    req: () => companiesNS.schemas.CompaniesPublicTreasuryByIdRequestSchema,
    res: () => companiesNS.schemas.CompaniesPublicTreasuryByIdResponseSchema,
  },
} as const satisfies Record<string, SchemaThunks>;

/** Union of all endpoint keys. */
export type Endpoint = keyof typeof ENDPOINTS;

/** Frozen list of endpoints for iteration in code/tests. */
export const ALL_ENDPOINTS = Object.freeze(Object.keys(ENDPOINTS) as Endpoint[]);

/** Zod request schema type for a given endpoint key. */
export type RequestSchemaOf<E extends Endpoint> = ReturnType<(typeof ENDPOINTS)[E]["req"]>;
/** Zod response schema type for a given endpoint key. */
export type ResponseSchemaOf<E extends Endpoint> = ReturnType<(typeof ENDPOINTS)[E]["res"]>;

/**
 * Get the request schema for a specific endpoint.
 * @param endpoint - Endpoint key (e.g. "/coins/{id}")
 * @returns The Zod schema for the request payload.
 */
export function getRequestSchema(endpoint: Endpoint): ZodType<unknown> {
  return ENDPOINTS[endpoint].req();
}

/**
 * Get the response schema for a specific endpoint.
 * @param endpoint - Endpoint key (e.g. "/coins/{id}")
 * @returns The Zod schema for the response payload.
 */
export function getResponseSchema(endpoint: Endpoint): ZodType<unknown> {
  return ENDPOINTS[endpoint].res();
}

/**
 * Get both request and response schemas for a specific endpoint.
 * @param endpoint - Endpoint key (e.g. "/coins/{id}")
 * @returns An object with `{ request, response }` Zod schemas.
 */
export function getSchemas(endpoint: Endpoint): {
  req: ZodType<unknown>;
  res: ZodType<unknown>;
} {
  const entry = ENDPOINTS[endpoint];
  return { req: entry.req(), res: entry.res() };
}
