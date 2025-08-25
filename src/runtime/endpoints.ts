/**
 * @file Runtime endpoint registry (string-literal union + helpers)
 * @summary Central list of supported CoinGecko API paths used by runtime helpers,
 *          tests, and docs. Keeps path strings typo-free and discoverable.
 * @remarks
 * - Keep this list in sync with the endpoints you actually expose.
 * - Templated segments use `{param}` braces (e.g. `/coins/{id}`).
 */

export const ENDPOINTS = [
  // Asset platforms
  "/asset_platforms",

  // Categories
  "/categories/list",

  // Coins
  "/coins/markets",
  "/coins/list",
  "/coins/{id}",
  "/coins/{id}/tickers",
  "/coins/{id}/history",
  "/coins/{id}/market_chart",
  "/coins/{id}/market_chart/range",
  "/coins/{id}/ohlc",

  // Companies (public treasury)
  "/companies/public_treasury/bitcoin",
  "/companies/public_treasury/ethereum",

  // Contract (per-chain token)
  "/contract/{id}/market_chart",
  "/contract/{id}/market_chart/range",

  // Derivatives
  "/derivatives",
  "/derivatives/exchanges",
  "/derivatives/exchanges/list",
  "/derivatives/exchanges/{id}",

  // Exchanges
  "/exchanges",
  "/exchanges/list",
  "/exchanges/{id}",

  // Global
  "/global",

  // Indexes
  "/indexes",
  "/indexes/list",
  "/indexes/{id}",
  "/indexes/{market_id}/{id}",

  // Ping
  "/ping",

  // Search
  "/search",
  "/search/trending",

  // Simple
  "/simple/price",
  "/simple/token_price/{id}",
] as const;

export type EndpointSet = (typeof ENDPOINTS)[number];
