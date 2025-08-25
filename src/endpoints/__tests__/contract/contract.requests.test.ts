/**
 * @file Request schema tests for the Coins API — Contract routes.
 * @summary Ensures path params + chart/range inputs validate (e.g., numeric unix seconds).
 * @remarks
 * Routes covered:
 * - GET /coins/{id}/contract/{contract_address}
 * - GET /coins/{id}/contract/{contract_address}/market_chart
 * - GET /coins/{id}/contract/{contract_address}/market_chart/range
 * @see ./docs/contract.functional.testing.md
 */

import { describe, it } from "vitest";
import type { z } from "zod";

import { contract } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

type CoinReqIn = z.input<typeof contract.schemas.CoinsByIdContractByAddressRequestSchema>;
type ChartReqIn = z.input<
  typeof contract.schemas.CoinsByIdContractByAddressMarketChartRequestSchema
>;
type RangeReqIn = z.input<
  typeof contract.schemas.CoinsByIdContractByAddressMarketChartRangeRequestSchema
>;

describe("contract.requests", () => {
  it("parses contract coin (id + contract_address)", () => {
    const req: CoinReqIn = {
      id: "ethereum",
      contract_address: "0x0000000000000000000000000000000000000000",
    };
    expectValid(contract.schemas.CoinsByIdContractByAddressRequestSchema, req);
  });

  it("parses market_chart (vs_currency + days)", () => {
    const req: ChartReqIn = {
      id: "ethereum",
      contract_address: "0x0000000000000000000000000000000000000000",
      vs_currency: "usd",
      days: 30, // number is fine; runtime normalizes to string
    };
    expectValid(contract.schemas.CoinsByIdContractByAddressMarketChartRequestSchema, req);
  });

  it("parses market_chart.range (vs_currency + from/to numbers)", () => {
    const req: RangeReqIn = {
      id: "ethereum",
      contract_address: "0x0000000000000000000000000000000000000000",
      vs_currency: "usd",
      from: 1714060800,
      to: 1714588800,
    };
    expectValid(contract.schemas.CoinsByIdContractByAddressMarketChartRangeRequestSchema, req);
  });

  it("rejects string timestamps for range", () => {
    const bad: unknown = {
      id: "ethereum",
      contract_address: "0x0000000000000000000000000000000000000000",
      vs_currency: "usd",
      from: "1714060800", // must be number
      to: "1714588800",
    };
    expectInvalid(contract.schemas.CoinsByIdContractByAddressMarketChartRangeRequestSchema, bad);
  });

  it("rejects missing id for coin request", () => {
    const bad: unknown = { contract_address: "0x0" };
    expectInvalid(contract.schemas.CoinsByIdContractByAddressRequestSchema, bad);
  });
});
