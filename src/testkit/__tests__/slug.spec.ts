// src/testkit/__tests__/slug.spec.ts
import { describe, expect, it } from "vitest";

import { slugFromPathTemplate } from "../slug.js";

describe("slugFromPathTemplate", () => {
  it("converts tokens to by-<param> and uses dot separators", (): void => {
    const s = slugFromPathTemplate("/coins/{id}/history");
    expect(s).toBe("coins.by-id.history");
  });

  it("preserves underscores and multiple params", (): void => {
    const s = slugFromPathTemplate("/coins/{id}/contract/{contract_address}/market_chart/range");
    expect(s).toBe("coins.by-id.contract.by-contract_address.market_chart.range");
  });

  it("uses exact param names per docs", (): void => {
    const s = slugFromPathTemplate("/companies/public_treasury/{coin_id}");
    expect(s).toBe("companies.public_treasury.by-coin_id");
  });
});
