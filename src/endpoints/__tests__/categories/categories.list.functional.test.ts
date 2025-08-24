/**
 * @file Functional tests for the categories/list endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/categories.functional.testing.md
 */
import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { categories, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type ListIn = z.input<typeof categories.schemas.CoinsCategoriesListRequestSchema>;

describe("categories.list – functional", () => {
  it("has no query params (empty object) → empty query", () => {
    const req: ListIn = {};
    expectValid(categories.schemas.CoinsCategoriesListRequestSchema, req);
    expect(buildQuery("/coins/categories/list", req)).toEqual({});
  });
});
