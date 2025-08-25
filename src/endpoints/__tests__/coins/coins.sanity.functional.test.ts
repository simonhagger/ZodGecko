/**
 * @file Sanity functional tests for the Coins API.
 * @summary Guards default-dropping and canonical serialization (e.g., CSV sorting).
 * @remarks
 * Representative routes sanity-checked:
 * - /coins/markets, /coins/list, /coins/{id}, /coins/{id}/tickers
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

// import { coins, buildQuery, type Endpoint, getSchemas } from "../../../index.js";
import { getSchemas, type Endpoint } from "../../../runtime/endpoints.js";
import { buildQuery } from "../../../runtime/query.js";
import { SERVER_DEFAULTS } from "../../../runtime/server-defaults.js";
import type { coins } from "../../index.js";
import { expectValid, dropPathParams, dropPathParamsTyped } from "../_utils/index.js";

type MarketsIn = z.input<typeof coins.schemas.CoinsMarketsRequestSchema>;
type ListIn = z.input<typeof coins.schemas.CoinsListRequestSchema>;
type DetailIn = z.input<typeof coins.schemas.CoinsByIdRequestSchema>;
type TickersIn = z.input<typeof coins.schemas.CoinsByIdTickersRequestSchema>;
type HistoryIn = z.input<typeof coins.schemas.CoinsByIdHistoryRequestSchema>;
type ChartIn = z.input<typeof coins.schemas.CoinsByIdMarketChartRequestSchema>;
type ChartRangeIn = z.input<typeof coins.schemas.CoinsByIdMarketChartRangeRequestSchema>;
type OhlcIn = z.input<typeof coins.schemas.CoinsByIdOhlcRequestSchema>;

describe("coins – sanity: server defaults are actually dropped", () => {
  /**
   * Helper: given an endpoint and a minimal base request, merge in that endpoint's defaults,
   * validate with the schema, drop path params, and assert none of the default keys survive
   * in the query object.
   */
  function assertDefaultsDrop(
    endpoint: Endpoint,
    base: Record<string, unknown>,
    pathKeys?: readonly string[],
  ): void {
    const defaults =
      (SERVER_DEFAULTS as Record<string, Record<string, unknown> | undefined>)[endpoint] ?? {};
    // Merge base + defaults (defaults can be overridden by base, but here we want equality-to-default)
    const req = { ...defaults, ...base };

    // Validate (runtime) without assigning the result
    expectValid(getSchemas(endpoint).req, req);

    // Remove path params before building the query
    const q = pathKeys ? dropPathParamsTyped(req, pathKeys) : dropPathParams(endpoint, req);

    const qs = buildQuery(endpoint, q);

    // Assert every default key is absent from the serialized query
    for (const key of Object.keys(defaults)) {
      expect(qs).not.toHaveProperty(key);
    }
  }

  it("/coins/markets – defaults drop", () => {
    const base: MarketsIn = { vs_currency: "usd" }; // required
    assertDefaultsDrop("/coins/markets", base);
  });

  it("/coins/list – defaults drop", () => {
    const base: ListIn = {}; // no required params
    assertDefaultsDrop("/coins/list", base);
  });

  it("/coins/{id} – defaults drop", () => {
    const base: DetailIn = { id: "bitcoin" }; // path param present
    assertDefaultsDrop("/coins/{id}", base, ["id"] as const);
  });

  it("/coins/{id}/tickers – defaults drop", () => {
    const base: TickersIn = { id: "bitcoin" }; // path param present
    assertDefaultsDrop("/coins/{id}/tickers", base, ["id"] as const);
  });

  it("/coins/{id}/history – defaults drop", () => {
    const base: HistoryIn = { id: "bitcoin", date: "24-12-2024" };
    assertDefaultsDrop("/coins/{id}/history", base, ["id"] as const);
  });

  it("/coins/{id}/market_chart – defaults drop", () => {
    const base: ChartIn = { id: "bitcoin", vs_currency: "usd", days: 1 };
    assertDefaultsDrop("/coins/{id}/market_chart", base, ["id"] as const);
  });

  it("/coins/{id}/market_chart/range – defaults drop", () => {
    const base: ChartRangeIn = {
      id: "bitcoin",
      vs_currency: "usd",
      from: 1714060800,
      to: 1714588800,
    };
    assertDefaultsDrop("/coins/{id}/market_chart/range", base, ["id"] as const);
  });

  it("/coins/{id}/ohlc – defaults drop", () => {
    const base: OhlcIn = { id: "bitcoin", vs_currency: "usd", days: "1" };
    assertDefaultsDrop("/coins/{id}/ohlc", base, ["id"] as const);
  });
});
