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

  it("drops empties and unknown types on a known endpoint", () => {
    const q = buildQuery("/coins/markets", {
      vs_currency: "usd",
      ids: ["", "bitcoin", null as unknown as string, "ethereum"], // stays safe
      page: 1, // default → dropped
      bogus: { a: 1 }, // object → not a supported type → dropped
      misc: Symbol("x") as unknown, // symbol → dropped, but typed safely
    });

    expect(q.vs_currency).toBe("usd");
    expect(q.ids).toBe("bitcoin,ethereum");
    expect(q).not.toHaveProperty("bogus");
    expect(q).not.toHaveProperty("misc");
    expect(q).not.toHaveProperty("page");
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
