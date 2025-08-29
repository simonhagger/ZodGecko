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
import * as asset_platforms from "../endpoints/asset_platforms/index.js";
import * as categories from "../endpoints/categories/index.js";
import * as coins from "../endpoints/coins/index.js";
import * as companies from "../endpoints/companies/index.js";
import * as contract from "../endpoints/contract/index.js";
import * as derivatives from "../endpoints/derivatives/index.js";
import * as exchanges from "../endpoints/exchanges/index.js";
import * as global from "../endpoints/global/index.js";
import * as ping from "../endpoints/ping/index.js";
import * as search from "../endpoints/search/index.js";
import * as simple from "../endpoints/simple/index.js";

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
    req: () => ping.schemas.PingRequestSchema,
    res: () => ping.schemas.PingResponseSchema,
  },

  // --- simple
  "/simple/price": {
    req: () => simple.schemas.SimplePriceRequestSchema,
    res: () => simple.schemas.SimplePriceResponseSchema,
  },
  "/simple/token_price/{id}": {
    req: () => simple.schemas.SimpleTokenPriceByIdRequestSchema,
    res: () => simple.schemas.SimpleTokenPriceByIdResponseSchema,
  },
  "/simple/supported_vs_currencies": {
    req: () => simple.schemas.SimpleSupportedVsCurrenciesRequestSchema,
    res: () => simple.schemas.SimpleSupportedVsCurrenciesResponseSchema,
  },

  // --- coins (incl. specialist endpoints)
  "/coins/list": {
    req: () => coins.schemas.CoinsListRequestSchema,
    res: () => coins.schemas.CoinsListResponseSchema,
  },
  "/coins/markets": {
    req: () => coins.schemas.CoinsMarketsRequestSchema,
    res: () => coins.schemas.CoinsMarketsResponseSchema,
  },
  "/coins/{id}": {
    req: () => coins.schemas.CoinsByIdRequestSchema,
    res: () => coins.schemas.CoinsByIdResponseSchema,
  },
  "/coins/{id}/tickers": {
    req: () => coins.schemas.CoinsByIdTickersRequestSchema,
    res: () => coins.schemas.CoinsByIdTickersResponseSchema,
  },
  "/coins/{id}/history": {
    req: () => coins.schemas.CoinsByIdHistoryRequestSchema,
    res: () => coins.schemas.CoinsByIdHistoryResponseSchema,
  },
  "/coins/{id}/market_chart": {
    req: () => coins.schemas.CoinsByIdMarketChartRequestSchema,
    res: () => coins.schemas.CoinsByIdMarketChartResponseSchema,
  },
  "/coins/{id}/market_chart/range": {
    req: () => coins.schemas.CoinsByIdMarketChartRangeRequestSchema,
    res: () => coins.schemas.CoinsByIdMarketChartRangeResponseSchema,
  },
  "/coins/{id}/ohlc": {
    req: () => coins.schemas.CoinsByIdOhlcRequestSchema,
    res: () => coins.schemas.CoinsByIdOhlcResponseSchema,
  },

  // --- contract
  "/coins/{id}/contract/{contract_address}": {
    req: () => contract.schemas.CoinsByIdContractByAddressRequestSchema,
    res: () => contract.schemas.CoinsByIdContractByAddressResponseSchema,
  },
  "/coins/{id}/contract/{contract_address}/market_chart": {
    req: () => contract.schemas.CoinsByIdContractByAddressMarketChartRequestSchema,
    res: () => contract.schemas.CoinsByIdContractByAddressMarketChartResponseSchema,
  },
  "/coins/{id}/contract/{contract_address}/market_chart/range": {
    req: () => contract.schemas.CoinsByIdContractByAddressMarketChartRangeRequestSchema,
    res: () => contract.schemas.CoinsByIdContractByAddressMarketChartRangeResponseSchema,
  },

  // --- categories
  "/coins/categories/list": {
    req: () => categories.schemas.CoinsCategoriesListRequestSchema,
    res: () => categories.schemas.CoinsCategoriesListResponseSchema,
  },
  "/coins/categories": {
    req: () => categories.schemas.CoinsCategoriesRequestSchema,
    res: () => categories.schemas.CoinsCategoriesResponseSchema,
  },

  // --- exchanges
  "/exchanges": {
    req: () => exchanges.schemas.ExchangesRequestSchema,
    res: () => exchanges.schemas.ExchangesResponseSchema,
  },
  "/exchanges/list": {
    req: () => exchanges.schemas.ExchangesListRequestSchema,
    res: () => exchanges.schemas.ExchangesListResponseSchema,
  },
  "/exchanges/{id}": {
    req: () => exchanges.schemas.ExchangesByIdRequestSchema,
    res: () => exchanges.schemas.ExchangesByIdResponseSchema,
  },
  "/exchanges/{id}/tickers": {
    req: () => exchanges.schemas.ExchangesByIdTickersRequestSchema,
    res: () => exchanges.schemas.ExchangesByIdTickersResponseSchema,
  },
  "/exchanges/{id}/volume_chart": {
    req: () => exchanges.schemas.ExchangesByIdVolumeChartRequestSchema,
    res: () => exchanges.schemas.ExchangesByIdVolumeChartResponseSchema,
  },

  // --- derivatives
  "/derivatives": {
    req: () => derivatives.schemas.DerivativesRequestSchema,
    res: () => derivatives.schemas.DerivativesResponseSchema,
  },
  "/derivatives/exchanges": {
    req: () => derivatives.schemas.DerivativesExchangesRequestSchema,
    res: () => derivatives.schemas.DerivativesExchangesResponseSchema,
  },
  "/derivatives/exchanges/{id}": {
    req: () => derivatives.schemas.DerivativesExchangesByIdRequestSchema,
    res: () => derivatives.schemas.DerivativesExchangesByIdResponseSchema,
  },
  "/derivatives/exchanges/list": {
    req: () => derivatives.schemas.DerivativesExchangesListRequestSchema,
    res: () => derivatives.schemas.DerivativesExchangesListResponseSchema,
  },

  // --- asset platforms
  "/asset_platforms": {
    req: () => asset_platforms.schemas.AssetPlatformsRequestSchema,
    res: () => asset_platforms.schemas.AssetPlatformsResponseSchema,
  },

  // --- search
  "/search": {
    req: () => search.schemas.SearchRequestSchema,
    res: () => search.schemas.SearchResponseSchema,
  },
  "/search/trending": {
    req: () => search.schemas.SearchTrendingRequestSchema,
    res: () => search.schemas.SearchTrendingResponseSchema,
  },

  // --- global
  "/global": {
    req: () => global.schemas.GlobalRequestSchema,
    res: () => global.schemas.GlobalResponseSchema,
  },
  "/global/decentralized_finance_defi": {
    req: () => global.schemas.GlobalDefiRequestSchema,
    res: () => global.schemas.GlobalDefiResponseSchema,
  },

  // --- companies (public treasury)
  "/companies/public_treasury/{coin_id}": {
    req: () => companies.schemas.CompaniesPublicTreasuryByIdRequestSchema,
    res: () => companies.schemas.CompaniesPublicTreasuryByIdResponseSchema,
  },
} as const satisfies Record<string, SchemaThunks>;

/** Union of all endpoint keys. */
export type Endpoint = keyof typeof ENDPOINTS;

/** Frozen list of endpoints for iteration in code/tests. */
export const ALL_ENDPOINTS = Object.freeze(Object.keys(ENDPOINTS).sort() as Endpoint[]);

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
