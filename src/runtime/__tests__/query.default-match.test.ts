// FILE: src/runtime/__tests__/query.default-match.test.ts
import { describe, it, expect } from "vitest";

import { buildQuery } from "../../runtime/query.js";

describe("buildQuery (exact default match branch)", () => {
  it("drops a single param when it equals endpoint default (hits def===normalized branch)", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      order: "market_cap_desc", // default for /coins/markets
    });
    // order should be dropped; only vs_currency remains
    expect(qsObj).toEqual({ vs_currency: "usd" });
  });

  it("drops sparkline=false default as well", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      sparkline: false, // default for /coins/markets
    });
    expect(qsObj).toEqual({ vs_currency: "usd" });
  });
});
