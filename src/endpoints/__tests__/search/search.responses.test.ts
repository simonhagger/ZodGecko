/**
 * @file src/endpoints/__tests__/search/search.responses.test.ts
 * @module tests.search.responses
 *
 * Response schema tests for:
 *  - GET /search
 *  - GET /search/trending
 * Uses tiny fixtures and proves tolerance to unknown fields.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import searchFixture from "./fixtures/search.response.json" with { type: "json" };
import trendingFixture from "./fixtures/search.trending.response.json" with { type: "json" };
import { search } from "../../../index.js";
import { isObjectRecord } from "../_utils/test-helpers.js";

// Local zod guards to assert key fields without unsafe access
const CoinRow = z.object({ id: z.string().min(1), name: z.string().min(1) });
const TrendingItem = z.object({ item: z.object({ id: z.string().min(1) }) });

describe("search.responses (fixtures)", () => {
  it("/search → parses and preserves unknown fields", () => {
    const parsed = search.schemas.SearchResponseSchema.parse(searchFixture as unknown);
    expect(Array.isArray(parsed.coins)).toBe(true);
    expect(parsed.coins.length).toBeGreaterThan(0);

    // Validate shape of first coin via zod guard
    expect(CoinRow.safeParse(parsed.coins[0]).success).toBe(true);

    // prove unknown key survives on wrapper (if present)
    expect(
      isObjectRecord(parsed) && Object.prototype.hasOwnProperty.call(parsed, "some_unknown"),
    ).toBe(true);
  });

  it("/search/trending → parses and preserves unknown fields", () => {
    const parsed = search.schemas.SearchTrendingResponseSchema.parse(trendingFixture as unknown);
    expect(Array.isArray(parsed.coins)).toBe(true);
    expect(parsed.coins.length).toBeGreaterThan(0);

    // Validate item structure with local guard
    expect(TrendingItem.safeParse(parsed.coins[0]).success).toBe(true);

    // unknown key on wrapper (if present)
    expect(
      isObjectRecord(parsed) && Object.prototype.hasOwnProperty.call(parsed, "some_unknown"),
    ).toBe(true);
  });
});
