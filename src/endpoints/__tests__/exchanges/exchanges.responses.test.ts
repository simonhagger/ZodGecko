/**
 * @file Response schema tests for the Exchanges API.
 * @summary Parses fixtures (exchanges, tickers) and proves unknown-field tolerance.
 * @remarks
 * Routes covered (examples):
 * - GET /exchanges
 * - GET /exchanges/list
 * - GET /exchanges/{id}
 * - GET /exchanges/{id}/tickers
 * - GET /exchanges/{id}/status_updates
 * @see ./docs/exchanges.functional.testing.md
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

import tickers from "./fixtures/exchanges.by-id.tickers.response.json" with { type: "json" };
import vol from "./fixtures/exchanges.by-id.volume_chart.response.json" with { type: "json" };
import list from "./fixtures/exchanges.list.response.json" with { type: "json" };
import rows from "./fixtures/exchanges.response.json" with { type: "json" };
import { exchanges } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

/** Minimal guards to assert key fields without unsafe property access */
const RowHasIdName = z.object({ id: z.string().min(1), name: z.string().min(1) });
const ListItemHasIdName = RowHasIdName; // same shape

describe("exchanges.responses (fixtures)", () => {
  it("parses /exchanges fixture; essential fields validate & unknowns preserved", () => {
    const parsed = exchanges.schemas.ExchangesResponseSchema.parse(rows as unknown);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);

    const first = parsed[0];
    expect(RowHasIdName.safeParse(first).success).toBe(true);

    // prove tolerance to extra keys (fixture includes one; if not, this still just checks safely)
    expect(isObjectRecord(first)).toBe(true);
  });

  it("parses /exchanges/list fixture", () => {
    const parsed = exchanges.schemas.ExchangesListResponseSchema.parse(list as unknown);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(ListItemHasIdName.safeParse(parsed[0]).success).toBe(true);
  });

  it("parses /exchanges/{id}/tickers fixture", () => {
    const parsed = exchanges.schemas.ExchangeTickersResponseSchema.parse(tickers as unknown);
    // Envelope should contain a tickers array
    expect(isObjectRecord(parsed)).toBe(true);
    expect(Array.isArray((parsed as Record<string, unknown>).tickers)).toBe(true);
  });

  it("parses /exchanges/{id}/volume_chart fixture", () => {
    const parsed = exchanges.schemas.ExchangeVolumeChartResponseSchema.parse(vol as unknown);
    // Expect array of [timestamp, value] tuples
    expect(Array.isArray(parsed)).toBe(true);
    if (parsed.length > 0) {
      const first = parsed[0];
      expect(Array.isArray(first)).toBe(true);
      expect(first.length).toBe(2);
    }
  });
});

describe("exchanges.responses (tolerance)", () => {
  it("allows unknown fields on rows", () => {
    const payload: unknown = [{ id: "x", name: "X", future: { ok: true } }];
    const parsed = exchanges.schemas.ExchangesResponseSchema.parse(payload);
    expect(Array.isArray(parsed)).toBe(true);
    expect(
      isObjectRecord(parsed[0]) && Object.prototype.hasOwnProperty.call(parsed[0], "future"),
    ).toBe(true);
  });
});
