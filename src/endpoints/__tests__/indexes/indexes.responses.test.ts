/**
 * @file Response schema tests for the Indexes API.
 * @summary Parses fixtures and proves tolerance to unknown fields.
 * @remarks
 * Routes covered:
 * - GET /indexes
 * - GET /indexes/list
 * - GET /indexes/{market_id}/{id}
 * @see ./docs/indexes.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import byIdFixture from "./fixtures/indexes.by-id.response.json" with { type: "json" };
import listFixture from "./fixtures/indexes.list.response.json" with { type: "json" };
import rowsFixture from "./fixtures/indexes.response.json" with { type: "json" };
import { indexes } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

const RowHasName = z.object({ name: z.string().min(1) });
const ListItemHasIdName = z.object({ id: z.string().min(1), name: z.string().min(1) });

describe("indexes.responses (fixtures)", () => {
  it("parses /indexes fixture; essentials validate", () => {
    const parsed = indexes.schemas.IndexesResponseSchema.parse(rowsFixture as unknown);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(RowHasName.safeParse(parsed[0]).success).toBe(true);
  });

  it("parses /indexes/list fixture", () => {
    const parsed = indexes.schemas.IndexesListResponseSchema.parse(listFixture as unknown);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(ListItemHasIdName.safeParse(parsed[0]).success).toBe(true);
  });

  it("parses /indexes/{market_id}/{id} fixture", () => {
    const parsed = indexes.schemas.IndexByIdResponseSchema.parse(byIdFixture as unknown);
    expect(isObjectRecord(parsed)).toBe(true);
    // basic sanity on key presence without unsafe access
    expect(isObjectRecord(parsed) && Object.prototype.hasOwnProperty.call(parsed, "name")).toBe(
      true,
    );
  });
});

describe("indexes.responses (tolerance)", () => {
  it("preserves unknown fields on row items", () => {
    const payload: unknown = [
      { name: "BTC Perp", market: "binance_futures", future: { ok: true } },
    ];
    const parsed = indexes.schemas.IndexesResponseSchema.parse(payload);
    expect(Array.isArray(parsed)).toBe(true);
    expect(
      isObjectRecord(parsed[0]) && Object.prototype.hasOwnProperty.call(parsed[0], "future"),
    ).toBe(true);
  });
});
