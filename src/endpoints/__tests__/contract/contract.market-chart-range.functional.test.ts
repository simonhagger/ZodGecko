/**
 * @file src/endpoints/__tests__/contract/contract.market-chart-range.functional.test.ts
 * @module tests/contract/market-chart-range
 * @endpoint GET /coins/{id}/contract/{contract_address}/market_chart/range
 * @summary Functional behavior for range chart; unix seconds as numbers only.
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { contract, buildQuery } from "../../../index.js";
import { expectValid, dropIdAndAddress } from "../_utils/index.js";

type RangeIn = z.input<typeof contract.schemas.ContractMarketChartRangeRequestSchema>;

describe("contract.market_chart.range – functional", () => {
  it("normalizes numeric from/to to strings", () => {
    const req: RangeIn = {
      id: "ethereum",
      contract_address: "0x0000000000000000000000000000000000000000",
      vs_currency: "usd",
      from: 1714060800,
      to: 1714588800,
    };
    expectValid(contract.schemas.ContractMarketChartRangeRequestSchema, req);

    const q = dropIdAndAddress(req);
    expect(buildQuery("/coins/{id}/contract/{contract_address}/market_chart/range", q)).toEqual({
      vs_currency: "usd",
      from: "1714060800",
      to: "1714588800",
    });
  });
});
