/**
 * @file Request schema tests for the Coins API.
 * @summary Validates request shapes for coins routes (ids, enums, flags, dates).
 * @remarks
 * Routes referenced (examples):
 * - /coins/markets, /coins/list, /coins/{id}, /coins/{id}/tickers, /coins/{id}/history
 * - /coins/{id}/market_chart, /coins/{id}/market_chart/range, /coins/{id}/ohlc
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { coins, buildQuery } from "../../../index.js";

describe("coins.requests", () => {
  const { CoinsMarketsRequestSchema } = coins.schemas;

  it("accepts minimal valid request", () => {
    const req = CoinsMarketsRequestSchema.parse({ vs_currency: "usd" });
    // Pagination defaults come from common.ts (per_page=100, page=1)
    expect(req.per_page).toBe(100);
    expect(req.page).toBe(1);
  });

  it("normalizes csv inputs via buildQuery (stable, deduped, sorted)", () => {
    const req = CoinsMarketsRequestSchema.parse({
      vs_currency: "usd",
      ids: ["ethereum", "bitcoin", "ethereum"],
    });

    // Your buildQuery lives in runtime and drops server defaults
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: req.vs_currency,
      ids: req.ids,
      per_page: req.per_page, // default → dropped
      page: req.page, // default → dropped
    });

    expect(qsObj).toEqual({
      ids: "bitcoin,ethereum",
      vs_currency: "usd",
    });

    const qs = new URLSearchParams(qsObj).toString();
    expect(qs).toBe("ids=bitcoin%2Cethereum&vs_currency=usd");
  });

  it("rejects invalid enum for order", () => {
    expect(() =>
      CoinsMarketsRequestSchema.parse({ vs_currency: "usd", order: "not-a-real-order" }),
    ).toThrow();
  });

  // extend src/endpoints/coins/__tests__/requests.test.ts
  it("drops default order but keeps non-default order", () => {
    const minimal = coins.schemas.CoinsMarketsRequestSchema.parse({ vs_currency: "usd" });
    const q1 = buildQuery("/coins/markets", { ...minimal, order: "market_cap_desc" });
    expect(q1.order).toBeUndefined();

    const q2 = buildQuery("/coins/markets", { ...minimal, order: "volume_asc" });
    expect(q2.order).toBe("volume_asc");
  });
});
