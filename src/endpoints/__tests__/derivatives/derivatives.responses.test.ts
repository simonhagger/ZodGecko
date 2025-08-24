/**
 * @file Response schema tests for the Derivatives API.
 * @summary Parses fixtures (markets, exchanges) and proves unknown-field tolerance.
 * @remarks
 * Routes covered:
 * - GET /derivatives
 * - GET /derivatives/exchanges
 * - GET /derivatives/exchanges/list
 * @see ./docs/derivatives.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import exFixture from "./fixtures/derivatives.exchanges.response.json" with { type: "json" };
import derivFixture from "./fixtures/derivatives.response.json" with { type: "json" };
import { derivatives } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

// tiny field guards (avoid reading props from unknown directly)
const DerivRowHasMarket = z.object({ market: z.string().min(1) });
const ExRowHasIdName = z.object({ id: z.string().min(1), name: z.string().min(1) });

describe("derivatives.responses (fixtures)", () => {
  it("parses /derivatives fixture; essential fields validate", () => {
    const rows = derivatives.schemas.DerivativesResponseSchema.parse(derivFixture as unknown);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(DerivRowHasMarket.safeParse(rows[0]).success).toBe(true);
  });
  it("parses /derivatives/exchanges fixture; essential fields validate", () => {
    const rows = derivatives.schemas.DerivativesExchangesResponseSchema.parse(exFixture as unknown);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(ExRowHasIdName.safeParse(rows[0]).success).toBe(true);
  });

  it("preserves unknown fields for /derivatives/exchanges (inline payload)", () => {
    // Use a tiny inline object to prove tolerance without mutating the fixture
    const payload: unknown = [
      { id: "binance_futures", name: "Binance Futures", some_unknown: "value" },
    ];
    const rows = derivatives.schemas.DerivativesExchangesResponseSchema.parse(payload);
    const first = rows[0];
    expect(
      isObjectRecord(first) && Object.prototype.hasOwnProperty.call(first, "some_unknown"),
    ).toBe(true);
  });
});
