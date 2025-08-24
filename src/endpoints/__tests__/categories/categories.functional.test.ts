/**
 * @file Functional tests for the categories endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/categories.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { categories, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type CatIn = z.input<typeof categories.schemas.CoinsCategoriesRequestSchema>;

describe("categories – functional", () => {
  it("has no query params (empty object) → empty query", () => {
    const req: CatIn = {};
    expectValid(categories.schemas.CoinsCategoriesRequestSchema, req);
    expect(buildQuery("/coins/categories", req)).toEqual({});
  });
});
