import { describe, it, expect } from "vitest";

import { buildQuery } from "../../runtime/query.js";

describe("buildQuery edge cases", () => {
  it("drops arrays that normalize to empty (hits empty-array branch)", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      // These normalize to undefined → array becomes empty → dropped (line ~46)
      ids: [" ", "", null, undefined],
      symbols: [], // empty array → dropped
    });

    expect(qsObj).toEqual({ vs_currency: "usd" });
  });

  it("keeps params when endpoint has NO defaults (exercises return path)", () => {
    const qsObj = buildQuery("/unknown/endpoint", {
      // These would be defaults for /coins/markets, but there are no defaults for this endpoint
      per_page: 100,
      page: 1,
      order: "market_cap_desc",
      vs_currency: "usd",
    });

    // All kept because no defaults for /unknown/endpoint
    expect(qsObj).toEqual({
      order: "market_cap_desc",
      page: "1",
      per_page: "100",
      vs_currency: "usd",
    });
  });

  it("keeps non-defaults when endpoint HAS defaults (exercises keep branch)", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      // Non-defaults for markets → should be kept; hits branch where key in defaults but value !== default
      per_page: 101,
      sparkline: true,
    });

    expect(qsObj).toEqual({
      per_page: "101",
      sparkline: "true",
      vs_currency: "usd",
    });
  });
});
