import { describe, it, expect } from "vitest";

import { buildQuery } from "../../runtime/query.js";

describe("runtime/query – array handling", () => {
  it("dedupes/sorts CSV arrays and drops empties", () => {
    const q = buildQuery("/simple/price", {
      ids: ["ethereum", "bitcoin", "bitcoin", ""],
      vs_currencies: ["usd", "eur", "usd", "  "],
      include_market_cap: false, // default → dropped
    });

    expect(q).toEqual({
      ids: "bitcoin,ethereum",
      vs_currencies: "eur,usd",
      // include_market_cap dropped
    });
  });
});
