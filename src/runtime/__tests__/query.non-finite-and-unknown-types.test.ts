// src/runtime/__tests__/query.non-finite-and-unknown-types.test.ts
import { describe, it, expect } from "vitest";

import { buildQuery } from "../../runtime/query.js";

describe("buildQuery edge primitives", () => {
  it("drops non-finite numbers (NaN/Infinity)", () => {
    const qsObj = buildQuery("/unknown/endpoint", {
      vs_currency: "usd",
      n1: NaN,
      n2: Infinity,
      n3: -Infinity,
    });
    // Only the valid param remains
    expect(qsObj).toEqual({ vs_currency: "usd" });
  });

  it("drops values of unsupported types (objects/functions)", () => {
    const qsObj = buildQuery("/unknown/endpoint", {
      vs_currency: "usd",
      o: { x: 1 } as unknown as string,
      f: ((): unknown => 1) as unknown as string,
    });
    expect(qsObj).toEqual({ vs_currency: "usd" });
  });

  it("keeps params not in defaults when endpoint DOES have defaults", () => {
    // /coins/markets has defaults for per_page/page/order/locale/sparkline,
    // but NOT for precision → must be kept even if equal to schema default.
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      precision: "2",
    });
    expect(qsObj).toEqual({ precision: "2", vs_currency: "usd" });
  });
});
