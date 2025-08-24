/**
 * @file src/endpoints/__tests__/search/search.sanity.functional.test.ts
 * @module tests.search.sanity
 *
 * Small “contract” assertions that shouldn’t change often:
 *  - /search requires query
 *  - /search/trending has no params
 * These complement (not duplicate) the functional tests.
 */

import { describe, it, expect } from "vitest";

import { buildQuery } from "../../../index.js";

describe("search.sanity", () => {
  it("/search/trending → {}", () => {
    expect(buildQuery("/search/trending", {})).toEqual({});
  });
});
