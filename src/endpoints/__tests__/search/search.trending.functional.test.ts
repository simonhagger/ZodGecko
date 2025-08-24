/**
 * @file Functional tests for Search — /search/trending.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /search/trending
 * - Pattern: {} → {}
 * @see ./docs/search.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { search, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type TrendingReqIn = z.input<typeof search.schemas.SearchTrendingRequestSchema>;

describe("search.trending – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: TrendingReqIn = {};
    expectValid(search.schemas.SearchTrendingRequestSchema, req);
    expect(buildQuery("/search/trending", req)).toEqual({});
  });
});
