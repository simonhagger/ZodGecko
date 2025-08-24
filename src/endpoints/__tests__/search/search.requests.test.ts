/**
 * @file src/endpoints/__tests__/search/search.requests.test.ts
 * @module tests.search.requests
 *
 * Request schema tests for the Search endpoints.
 * Covers:
 *  - GET /search (requires ?query=)
 *  - GET /search/trending (no params)
 */

import { describe, it } from "vitest";
import type { z } from "zod";

import { search } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/test-helpers.js";

type SearchReqIn = z.input<typeof search.schemas.SearchRequestSchema>;
type TrendingReqIn = z.input<typeof search.schemas.SearchTrendingRequestSchema>;

describe("search.requests", () => {
  it("/search → requires query", () => {
    const ok: SearchReqIn = { query: "bitcoin" };
    expectValid(search.schemas.SearchRequestSchema, ok);

    // missing query
    expectInvalid(search.schemas.SearchRequestSchema, {} as unknown);
    // extra fields rejected (strict)
    expectInvalid(search.schemas.SearchRequestSchema, { query: "eth", extra: 1 } as unknown);
  });

  it("/search/trending → no params (strict empty object)", () => {
    const ok: TrendingReqIn = {};
    expectValid(search.schemas.SearchTrendingRequestSchema, ok);

    // any key should fail (strict)
    expectInvalid(search.schemas.SearchTrendingRequestSchema, { foo: "bar" } as unknown);
  });
});
