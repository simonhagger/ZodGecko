/**
 * @file src/endpoints/__tests__/contract/contract.market-chart.functional.test.ts
 * @module tests/contract/market-chart
 * @endpoint GET /coins/{id}/contract/{contract_address}/market_chart
 * @summary Functional behavior for market chart; number→string, default handling.
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { contract, buildQuery } from "../../../index.js";
import { expectValid, dropIdAndAddress } from "../_utils/index.js";

type ChartIn = z.input<typeof contract.schemas.ContractMarketChartRequestSchema>;

describe("contract.market_chart – functional", () => {
  it("normalizes days (number→string)", () => {
    const req: ChartIn = {
      id: "ethereum",
      contract_address: "0x0000000000000000000000000000000000000000",
      vs_currency: "usd",
      days: 30,
    };
    expectValid(contract.schemas.ContractMarketChartRequestSchema, req);

    const q = dropIdAndAddress(req);
    expect(buildQuery("/coins/{id}/contract/{contract_address}/market_chart", q)).toEqual({
      vs_currency: "usd",
      days: "30",
    });
  });
});
