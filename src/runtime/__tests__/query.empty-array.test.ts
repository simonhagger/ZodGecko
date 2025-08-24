// FILE: src/runtime/__tests__/query.empty-array.test.ts
import { describe, it, expect } from "vitest";

import { buildQuery } from "../../runtime/query.js";

describe("buildQuery (empty array normalization)", () => {
  it("drops array when all elements normalize to undefined (hits empty-array branch)", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      // everything trims/drops → empty list → early return path
      ids: ["", "   ", null, undefined],
    });
    expect(qsObj).toEqual({ vs_currency: "usd" });
  });
});
