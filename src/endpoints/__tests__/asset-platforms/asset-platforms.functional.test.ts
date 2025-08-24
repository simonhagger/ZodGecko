/**
 * @file Functional tests for the asset-platforms endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/asset-platforms.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { assetPlatforms, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

type ListRequestInput = z.input<typeof assetPlatforms.schemas.AssetPlatformsRequestSchema>;

describe("asset-platforms – functional", () => {
  it("no params → empty query", () => {
    const req: ListRequestInput = {};
    expectValid(assetPlatforms.schemas.AssetPlatformsRequestSchema, req);
    expect(buildQuery("/asset_platforms", req)).toEqual({});
  });

  it("rejects unknown params", () => {
    // Schema is strict(); any extra keys should fail validation.
    expectInvalid(assetPlatforms.schemas.AssetPlatformsRequestSchema, { foo: "bar" });
  });
});
