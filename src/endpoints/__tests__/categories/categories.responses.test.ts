/**
 * @file Response schema tests for the Coins API — Categories routes.
 * @summary Parses fixtures and proves tolerance to unknown fields.
 * @remarks
 * Routes covered:
 * - GET /coins/categories
 * - GET /coins/categories/list
 * - Style: use small fixtures for happy-path; inline payloads for tolerance.
 * @see ./docs/categories.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import listFixture from "./fixtures/categories.list.response.json" with { type: "json" };
import catFixture from "./fixtures/categories.response.json" with { type: "json" };
import { categories } from "../../../index.js";

// tiny guard to avoid unsafe property access on unknown
const isObjectRecord = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === "object";

const RowHasIdName = z.object({ id: z.string().min(1), name: z.string().min(1) });

describe("categories.responses", () => {
  it("parses /coins/categories/list (tolerant, essential fields okay)", () => {
    const rows = categories.schemas.CoinsCategoriesListResponseSchema.parse(listFixture as unknown);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    const first = rows[0];
    expect(RowHasIdName.safeParse(first).success).toBe(true);
  });

  it("parses /coins/categories with tolerant objects; unknown fields preserved", () => {
    const rows = categories.schemas.CoinsCategoriesResponseSchema.parse(catFixture as unknown);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    const first = rows[0];
    expect(RowHasIdName.safeParse(first).success).toBe(true);

    // prove unknown key survived without unsafe indexing
    expect(
      isObjectRecord(first) && Object.prototype.hasOwnProperty.call(first, "some_future_field"),
    ).toBe(true);
  });
});
