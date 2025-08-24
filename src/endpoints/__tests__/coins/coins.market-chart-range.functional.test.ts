/**
 * @file Functional tests for the coins/{id}/market_chart/range endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { coins, buildQuery } from "../../../index.js";
import { dropId } from "../_utils/index.js";

type MarketChartRangeRequestInput = z.input<typeof coins.schemas.MarketChartRangeRequestSchema>;

describe("coins.market_chart.range – functional", () => {
  it("normalizes numeric from/to to strings; keeps precision when provided", () => {
    const req: MarketChartRangeRequestInput = {
      id: "bitcoin",
      vs_currency: "usd",
      from: 1714060800,
      to: 1714588800,
      precision: "2",
    };

    expect(() => coins.schemas.MarketChartRangeRequestSchema.parse(req)).not.toThrow();

    // strip path param for query building
    const q = dropId(req);

    expect(buildQuery("/coins/{id}/market_chart/range", q)).toEqual({
      from: "1714060800",
      to: "1714588800",
      vs_currency: "usd",
      precision: "2",
    });
  });

  it("rejects string unix timestamps", () => {
    // schema should refuse strings for from/to
    expect(() =>
      coins.schemas.MarketChartRangeRequestSchema.parse({
        id: "bitcoin",
        vs_currency: "usd",
        from: "1714060800" as unknown as number,
        to: "1714588800" as unknown as number,
      }),
    ).toThrow();
  });
});
