/**
 * @file Request schema tests for the Asset Platforms API.
 * @summary Validates strict, no-param request shape.
 * @remarks
 * Routes covered:
 * - GET /asset_platforms
 * @see ./docs/asset-platforms.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { assetPlatforms, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

// Request schema is strict and has no params.
type ListReqIn = z.input<typeof assetPlatforms.schemas.AssetPlatformsRequestSchema>;

describe("asset-platforms.requests", () => {
  it("{} is valid and serializes to an empty query", () => {
    const req: ListReqIn = {};
    expectValid(assetPlatforms.schemas.AssetPlatformsRequestSchema, req);
    expect(buildQuery("/asset_platforms", req)).toEqual({});
  });

  it("rejects unknown keys (strict schema)", () => {
    expectInvalid(assetPlatforms.schemas.AssetPlatformsRequestSchema, { foo: "bar" });
  });
});
