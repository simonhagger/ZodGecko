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
