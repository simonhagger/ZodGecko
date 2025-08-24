/**
 * @file Functional tests for the coins/list endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { coins, buildQuery } from "../../../index.js";

describe("coins.list – functional", () => {
  it("no params → empty query", () => {
    const req = coins.schemas.CoinsListRequestSchema.parse({});
    expect(buildQuery("/coins/list", req)).toEqual({});
  });
  it("include_platform true kept; false dropped", () => {
    expect(buildQuery("/coins/list", { include_platform: true })).toEqual({
      include_platform: "true",
    });
    expect(buildQuery("/coins/list", { include_platform: false })).toEqual({});
  });
});
