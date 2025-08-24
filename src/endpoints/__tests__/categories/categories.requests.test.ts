/**
 * @file Request schema tests for the Coins API — Categories routes.
 * @summary Validates strict, no-param request shapes.
 * @remarks
 * Routes covered:
 * - GET /coins/categories
 * - GET /coins/categories/list
 * - Pattern: `{}` is valid and serializes to `{}`; unknown keys are rejected.
 * @see ./docs/categories.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { categories, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

// Both /coins/categories and /coins/categories/list are strict no-param requests.
type CatsReqIn = z.input<typeof categories.schemas.CoinsCategoriesRequestSchema>;
type CatsListReqIn = z.input<typeof categories.schemas.CoinsCategoriesListRequestSchema>;

describe("categories.requests", () => {
  it("/coins/categories → {} is valid and serializes to {}", () => {
    const req: CatsReqIn = {};
    expectValid(categories.schemas.CoinsCategoriesRequestSchema, req);
    expect(buildQuery("/coins/categories", req)).toEqual({});
  });

  it("/coins/categories rejects unknown keys", () => {
    expectInvalid(categories.schemas.CoinsCategoriesRequestSchema, { nope: true });
  });

  it("/coins/categories/list → {} is valid and serializes to {}", () => {
    const req: CatsListReqIn = {};
    expectValid(categories.schemas.CoinsCategoriesListRequestSchema, req);
    expect(buildQuery("/coins/categories/list", req)).toEqual({});
  });

  it("/coins/categories/list rejects unknown keys", () => {
    expectInvalid(categories.schemas.CoinsCategoriesListRequestSchema, { extra: "x" });
  });
});
