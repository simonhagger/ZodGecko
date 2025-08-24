// src/runtime/__tests__/query.defaults-true.test.ts
import { describe, it, expect } from "vitest";

import { buildQuery } from "../../runtime/query.js";

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
