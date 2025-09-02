// FILE: src/runtime/__tests__/query.test.ts
import { describe, expect, it } from "vitest";

import { buildQuery } from "../../index.js";

describe("buildQuery", () => {
  it("drops server defaults and alphabetizes keys", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      per_page: 100, // default → dropped
      page: 1, // default → dropped
      order: "market_cap_desc", // default → dropped
      ids: ["ethereum", "bitcoin", "ethereum"],
    });

    expect(qsObj).toEqual({
      ids: "bitcoin,ethereum",
      vs_currency: "usd",
    });

    const qs = new URLSearchParams(qsObj).toString();
    expect(qs).toBe("ids=bitcoin%2Cethereum&vs_currency=usd");
  });

  it("drops empty/invalid values and endpoint-specific defaults", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      names: [], // dropped
      symbols: "  ", // dropped (trim → empty)
      sparkline: false, // default for /coins/markets → dropped
    });

    expect(qsObj).toEqual({ vs_currency: "usd" });
  });

  it("keeps non-defaults and normalizes arrays to stable CSV", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      per_page: 50, // not a default → keep
      ids: ["btc", "eth", "btc"], // dedupe + sort → "btc,eth"
    });

    expect(qsObj).toEqual({
      ids: "btc,eth",
      per_page: "50",
      vs_currency: "usd",
    });
  });
});
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
describe("buildQuery with defaults that are true", () => {
  it("drops params equal to defaults (true/false as documented)", () => {
    // /coins/{id} defaults: localization:true, tickers:true, market_data:true, ... sparkline:false
    const qsObj = buildQuery("/coins/{id}", {
      localization: true, // drop
      tickers: true, // drop
      market_data: true, // drop
      sparkline: false, // drop
    });
    expect(qsObj).toEqual({});
  });

  it("keeps params that differ from defaults", () => {
    const qsObj = buildQuery("/coins/{id}", {
      localization: false, // keep
      tickers: false, // keep
    });
    expect(qsObj).toEqual({
      localization: "false",
      tickers: "false",
    });
  });
});
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
describe("buildQuery edge primitives", () => {
  it("drops non-finite numbers (NaN/Infinity)", () => {
    const qsObj = buildQuery("/coins/markets", {
      vs_currency: "usd",
      n1: NaN,
      n2: Infinity,
      n3: -Infinity,
    });
    // Only the valid param remains
    expect(qsObj).toEqual({ vs_currency: "usd" });
  });

  it("drops values of unsupported types (objects/functions)", () => {
    const qsObj = buildQuery("/coins/markets", {
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
