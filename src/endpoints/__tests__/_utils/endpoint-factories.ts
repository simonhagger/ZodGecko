/**
 * @file Endpoint factories for meta/smoke tests
 * @internal
 *
 * Centralized “minimal valid” request makers and “tolerant response” makers,
 * keyed by the Endpoint union. Tests iterate these maps to validate schemas
 * without duplicating shapes in every suite.
 */

import type { Endpoint } from "../../../runtime/endpoints.js";

// Convenience: fixed ids/addresses used in multiple places
const COIN = "bitcoin";
const SYMBOL = "btc";
const NAME = "Bitcoin";
const VS = "usd";
const CHAIN = "ethereum";
const ADDR0 = "0x0000000000000000000000000000000000000000";

export type RequestFactory = Partial<Record<Endpoint, () => unknown>>;
export type ResponseFactory = Partial<Record<Endpoint, () => unknown>>;

/**
 * Minimal-valid request payloads per endpoint.
 * Aim for smallest object that the schema accepts.
 * Include path keys (e.g. { id }) so we can also test dropPathParams=true.
 */
export const REQ_FACTORY: RequestFactory = {
  // ping
  "/ping": () => ({}),

  // simple
  "/simple/price": () => ({ ids: [COIN], vs_currencies: [VS] }),
  "/simple/token_price/{id}": () => ({
    id: CHAIN,
    contract_addresses: [ADDR0],
    vs_currencies: [VS],
  }),
  "/simple/supported_vs_currencies": () => ({}),

  // coins
  "/coins/list": () => ({}),
  "/coins/markets": () => ({ vs_currency: VS }),
  "/coins/{id}": () => ({
    id: COIN,
    localization: false,
    tickers: false,
    market_data: false,
    community_data: false,
    developer_data: false,
    sparkline: false,
  }),
  "/coins/{id}/tickers": () => ({ id: COIN, page: 1 }),
  "/coins/{id}/history": () => ({ id: COIN, date: "01-01-2020" }),
  "/coins/{id}/market_chart": () => ({ id: COIN, vs_currency: VS, days: "1" }),
  "/coins/{id}/market_chart/range": () => ({
    id: COIN,
    vs_currency: VS,
    from: 1609459200, // 2021-01-01T00:00:00Z
    to: 1609545600, // 2021-01-02T00:00:00Z
  }),
  "/coins/{id}/ohlc": () => ({ id: COIN, vs_currency: VS, days: "1" }),

  // contract (ERC-20 subroutes)
  "/coins/{id}/contract/{contract_address}": () => ({
    id: CHAIN,
    contract_address: ADDR0,
  }),
  "/coins/{id}/contract/{contract_address}/market_chart": () => ({
    id: CHAIN,
    contract_address: ADDR0,
    vs_currency: VS,
    days: 1,
  }),
  "/coins/{id}/contract/{contract_address}/market_chart/range": () => ({
    id: CHAIN,
    contract_address: ADDR0,
    vs_currency: VS,
    from: 1609459200,
    to: 1609545600,
  }),

  // categories
  "/coins/categories/list": () => ({}),
  "/coins/categories": () => ({}),

  // exchanges
  "/exchanges": () => ({}),
  "/exchanges/list": () => ({}),
  "/exchanges/{id}": () => ({ id: "binance" }),
  "/exchanges/{id}/tickers": () => ({ id: "binance", page: 1 }),
  "/exchanges/{id}/volume_chart": () => ({ id: "binance", days: 1 }),

  // derivatives
  "/derivatives": () => ({}),
  "/derivatives/exchanges": () => ({}),
  "/derivatives/exchanges/{id}": () => ({ id: "binance_futures" }),
  "/derivatives/exchanges/list": () => ({}),

  // asset platforms
  "/asset_platforms": () => ({}),

  // search
  "/search": () => ({ query: "bit" }),
  "/search/trending": () => ({}),

  // global
  "/global": () => ({}),
  "/global/decentralized_finance_defi": () => ({}),

  // companies (public treasury)
  "/companies/public_treasury/{coin_id}": () => ({ coin_id: COIN }),
};

/**
 * Tolerant minimal response payloads per endpoint.
 * Prefer empty arrays/containers or the smallest shape your schemas accept.
 * These are *not* meant to be exhaustive—just smoke coverage.
 */
export const RESP_FACTORY: ResponseFactory = {
  "/ping": () => ({ gecko_says: "(V3) To the Moon!" }),

  "/simple/price": () => ({ [COIN]: { [VS]: 123.45 } }),
  "/simple/token_price/{id}": () => ({ [ADDR0]: { [VS]: 1 } }),
  "/simple/supported_vs_currencies": () => [VS, "eur"],

  "/coins/list": () => [], // arrays usually tolerate empty
  "/coins/markets": () => [],

  "/coins/{id}/tickers": () => ({ tickers: [] }),
  "/coins/{id}/market_chart": () => ({ prices: [], market_caps: [], total_volumes: [] }),
  "/coins/{id}/market_chart/range": () => ({ prices: [], market_caps: [], total_volumes: [] }),
  "/coins/{id}/ohlc": () => [],

  "/coins/{id}/contract/{contract_address}": () => ({ id: COIN, symbol: SYMBOL, name: NAME }), // tolerant on unknowns
  "/coins/{id}/contract/{contract_address}/market_chart": () => ({
    prices: [],
    market_caps: [],
    total_volumes: [],
  }),
  "/coins/{id}/contract/{contract_address}/market_chart/range": () => ({
    prices: [],
    market_caps: [],
    total_volumes: [],
  }),

  "/coins/categories/list": () => [],
  "/coins/categories": () => [],

  "/exchanges": () => [],
  "/exchanges/list": () => [],
  "/exchanges/{id}": () => ({ id: "binance", name: "Binance" }),
  "/exchanges/{id}/tickers": () => ({ tickers: [] }),
  "/exchanges/{id}/volume_chart": () => [],

  "/derivatives": () => [],
  "/derivatives/exchanges": () => [],
  "/derivatives/exchanges/{id}": () => ({ name: "Binance Futures" }),
  "/derivatives/exchanges/list": () => [],

  "/asset_platforms": () => [],

  "/search": () => ({ coins: [], exchanges: [], categories: [], icos: [], nfts: [] }),
  "/search/trending": () => ({ coins: [] }),

  "/global": () => ({ data: {} }),
  "/global/decentralized_finance_defi": () => ({ data: {} }),

  "/companies/public_treasury/{coin_id}": () => [
    {
      name: "ACME Corp",
      symbol: "ACME",
      country: "US",
      total_holdings: 0,
      total_entry_value_usd: 0,
      total_current_value_usd: 0,
      percentage_of_supply: 0,
    },
  ],
};
