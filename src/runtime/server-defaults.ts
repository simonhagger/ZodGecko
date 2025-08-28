/**
 * @file src/runtime/server-defaults.ts
 * @module runtime/server-defaults
 *
 * Server-side default parameter values for selected CoinGecko API endpoints.
 *
 * These values are documented in the official API spec or inferred from
 * observed behavior. The {@link buildQuery} function will omit parameters
 * from client requests if their value matches the corresponding server
 * default after normalization.
 *
 * This ensures:
 *  - Leaner requests (no redundant params)
 *  - Stable cache keys (since defaults are dropped consistently)
 *
 * ⚠️ Keep this list aligned with CoinGecko’s published defaults.
 */

import type { Endpoint } from "./endpoints.js";

/** Map of endpoint → (param → default value). Not all endpoints have defaults. */
type DefaultMap = Partial<Record<Endpoint, Readonly<Record<string, unknown>>>>;

const EMPTY_DEFAULTS: Readonly<Record<string, unknown>> = Object.freeze({});

/**
 * Default query parameter values per endpoint.
 *
 * Keys are endpoint paths (e.g., `"/coins/markets"`), and values are records
 * of query param → default value.
 *
 * @example
 * ```ts
 * SERVER_DEFAULTS["/coins/markets"].per_page; // 100
 * ```
 */
export const SERVER_DEFAULTS: DefaultMap = {
  /**
   * Ping Endpoints
   */

  /** GET /ping */
  "/ping": {
    // No defaults for this endpoint, included for completeness
  },

  /**
   * Simple Endpoints
   */

  /** GET /simple/price */
  "/simple/price": {
    include_tokens: "top",
    include_market_cap: false,
    include_24hr_vol: false,
    include_24hr_change: false,
    include_last_updated_at: false,
  },

  /** GET /simple/token_price/{id} */
  "/simple/token_price/{id}": {
    include_market_cap: false,
    include_24hr_vol: false,
    include_24hr_change: false,
    include_last_updated_at: false,
  },

  /** GET /simple/supported_vs_currencies */
  "/simple/supported_vs_currencies": {
    // No defaults for this endpoint, included for completeness
  },

  /**
   * Coins Endpoints
   */

  /** GET /coins/list */
  "/coins/list": {
    include_platform: false,
  },

  /** GET /coins/markets */
  "/coins/markets": {
    include_tokens: "top",
    order: "market_cap_desc",
    per_page: 100,
    page: 1,
    sparkline: false,
    price_change_percentage: "24h",
    locale: "en",
  },

  /** GET /coins/{id} */
  "/coins/{id}": {
    localization: true,
    tickers: true,
    market_data: true,
    community_data: true,
    developer_data: true,
    sparkline: false,
    dex_pair_format: "contract_address",
  },

  /** GET /coins/{id}/tickers */
  "/coins/{id}/tickers": {
    include_exchange_logo: false,
    page: 1,
    order: "trust_score_desc",
    depth: false,
    dex_pair_format: "contract_address",
  },

  /** GET /coins/{id}/history */
  "/coins/{id}/history": {
    localization: true,
  },

  /** GET /coins/{id}/market_chart */
  "/coins/{id}/market_chart": {
    // No defaults for this endpoint, included for completeness
  },

  /** GET /coins/{id}/market_chart/range */
  "/coins/{id}/market_chart/range": {
    // No defaults for this endpoint, included for completeness
  },

  /** GET /coins/{id}/ohlc */
  "/coins/{id}/ohlc": {
    // No defaults for this endpoint, included for completeness
  },

  /**
   * Contract Endpoints
   */

  /** GET /coins/{id}/contract/{contract_address} */
  "/coins/{id}/contract/{contract_address}": {
    // No defaults for this endpoint, included for completeness
  },

  /** GET coins/{id}/contract/{contract_address}/market_chart */
  "/coins/{id}/contract/{contract_address}/market_chart": {
    // No defaults for this endpoint, included for completeness
  },

  /** GET coins/{id}/contract/{contract_address}/market_chart/range */
  "/coins/{id}/contract/{contract_address}/market_chart/range": {
    // No defaults for this endpoint, included for completeness
  },

  // Add more endpoints as verified against the API
} as const satisfies DefaultMap;

export function getServerDefaults(path: Endpoint): Readonly<Record<string, unknown>> {
  const entry: unknown = (SERVER_DEFAULTS as Record<string, unknown>)[path];
  if (entry && typeof entry === "object") {
    return entry as Readonly<Record<string, unknown>>;
  }
  return EMPTY_DEFAULTS;
}
