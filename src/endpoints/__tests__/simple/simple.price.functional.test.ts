/**
 * @file Functional tests for Simple — /simple/price.
 * @summary Verifies CSV normalization and boolean serialization.
 * @remarks
 * Route covered:
 * - GET /simple/price
 * @see ./docs/simple.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { simple, buildQuery } from "../../../index.js";

type PriceReqIn = z.input<typeof simple.schemas.SimplePriceRequestSchema>;

describe("simple.price – functional", () => {
  it("normalizes arrays to CSV and serializes booleans", () => {
    const req: PriceReqIn = {
      ids: ["ethereum", "bitcoin", "bitcoin"],
      vs_currencies: ["usd", "eur"],
      include_market_cap: true,
      include_24hr_vol: true,
      include_24hr_change: false,
      include_last_updated_at: true,
    };
    const parsed = simple.schemas.SimplePriceRequestSchema.parse(req);
    expect(buildQuery("/simple/price", parsed)).toEqual({
      ids: "bitcoin,ethereum",
      vs_currencies: "eur,usd",
      include_market_cap: "true",
      include_24hr_vol: "true",
      precision: "2",
      include_last_updated_at: "true",
    });
  });
});
