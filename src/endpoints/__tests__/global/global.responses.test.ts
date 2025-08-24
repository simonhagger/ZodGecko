/**
 * @file Response schema tests for the Global API.
 * @summary Parses fixtures and proves unknown-field tolerance.
 * @remarks
 * Routes covered:
 * - GET /global
 * - GET /global/decentralized_finance_defi
 * @see ./docs/global.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import defiFixture from "./fixtures/global.defi.response.json" with { type: "json" };
import globalFixture from "./fixtures/global.response.json" with { type: "json" };
import { global as globalNs } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

const HasMarketCapUsd = z.object({
  data: z.object({
    total_market_cap: z.record(z.string(), z.number()).optional(),
  }),
});

describe("global.responses (fixtures)", () => {
  it("parses /global fixture; essential fields validate", () => {
    const parsed = globalNs.schemas.GlobalResponseSchema.parse(globalFixture as unknown);
    expect(HasMarketCapUsd.safeParse(parsed).success).toBe(true);
  });

  it("parses /global/decentralized_finance_defi fixture; essential fields validate", () => {
    const parsed = globalNs.schemas.GlobalDefiResponseSchema.parse(defiFixture as unknown);
    expect(isObjectRecord(parsed)).toBe(true);
  });
});

describe("global.responses (tolerance)", () => {
  it("preserves unknown fields (inline payload)", () => {
    const payload: unknown = { data: { some_future_field: { ok: true } } };
    const parsed = globalNs.schemas.GlobalResponseSchema.parse(payload);
    const rec = parsed as Record<string, unknown>;
    expect(
      isObjectRecord(rec["data"]) &&
        Object.prototype.hasOwnProperty.call(rec["data"], "some_future_field"),
    ).toBe(true);
  });
});
