/**
 * @file Functional tests for the coins/{id}/market_chart endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { coins, buildQuery } from "../../../index.js";
import { dropId } from "../_utils/index.js";

type MarketChartRequestInput = z.input<typeof coins.schemas.CoinsByIdMarketChartRequestSchema>;

describe("coins.market_chart – functional", () => {
  it("normalizes days (number→string), keeps interval, keeps precision when provided", () => {
    const req: MarketChartRequestInput = {
      id: "bitcoin",
      vs_currency: "usd",
      days: 30,
      interval: "daily",
      precision: "2",
    };

    expect(() => coins.schemas.CoinsByIdMarketChartRequestSchema.parse(req)).not.toThrow();

    // strip path param for query building
    const q = dropId(req);

    expect(buildQuery("/coins/{id}/market_chart", q)).toEqual({
      days: "30",
      interval: "daily",
      precision: "2",
      vs_currency: "usd",
    });
  });
});
