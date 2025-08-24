/**
 * @file Functional tests for Search — /search.
 * @summary Verifies required query param and serialization.
 * @see ./docs/search.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { search, buildQuery } from "../../../index.js";

type SearchReqIn = z.input<typeof search.schemas.SearchRequestSchema>;

describe("search – functional", () => {
  it("/search → serializes query", () => {
    const req: SearchReqIn = { query: "bitcoin" };
    const parsed = search.schemas.SearchRequestSchema.parse(req);
    expect(buildQuery("/search", parsed)).toEqual({ query: "bitcoin" });
  });
});
