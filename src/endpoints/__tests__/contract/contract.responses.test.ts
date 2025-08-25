/**
 * @file Response schema tests for the Coins API — Contract routes.
 * @summary Parses chart/range fixtures and proves unknown-field tolerance.
 * @remarks
 * Routes covered:
 * - GET /coins/{id}/contract/{contract_address}/market_chart
 * - GET /coins/{id}/contract/{contract_address}/market_chart/range
 * - Style: fixtures for happy-path; inline payloads for tolerance.
 * @see ./docs/contract.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import rangeFixture from "./fixtures/contract.market-chart-range.response.json" with { type: "json" };
import mcFixture from "./fixtures/contract.market-chart.response.json" with { type: "json" };
import { contract } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

// local guards so we don't read from unknown directly
const HasChartArrays = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
  market_caps: z.array(z.tuple([z.number(), z.number()])),
  total_volumes: z.array(z.tuple([z.number(), z.number()])),
});

describe("contract.responses", () => {
  it("parses market_chart fixture; essential arrays/tuples validate", () => {
    const parsed = contract.schemas.CoinsByIdContractByAddressMarketChartResponseSchema.parse(
      mcFixture as unknown,
    );
    expect(HasChartArrays.safeParse(parsed).success).toBe(true);
  });

  it("parses market_chart.range fixture; essential arrays/tuples validate", () => {
    const parsed = contract.schemas.CoinsByIdContractByAddressMarketChartRangeResponseSchema.parse(
      rangeFixture as unknown,
    );
    expect(HasChartArrays.safeParse(parsed).success).toBe(true);
  });

  it("tolerates unknown top-level fields (passthrough)", () => {
    const payload: unknown = {
      prices: [[1710374400000, 123.45]],
      market_caps: [[1710374400000, 9999999]],
      total_volumes: [[1710374400000, 54321]],
      some_future_field: { ok: true },
    };
    const parsed =
      contract.schemas.CoinsByIdContractByAddressMarketChartResponseSchema.parse(payload);
    expect(
      isObjectRecord(parsed) && Object.prototype.hasOwnProperty.call(parsed, "some_future_field"),
    ).toBe(true);
  });
});
