/**
 * @file Sanity functional tests for the Asset Platforms API.
 * @summary Guards `{}` → `{}` serialization and lack of server defaults.
 * @remarks
 * Routes covered:
 * - GET /asset_platforms
 * @see ./docs/asset-platforms.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { buildQuery, serverDefaults } from "../../../index.js";

describe("asset-platforms – sanity", () => {
  it("has no server defaults and serializes to an empty query", () => {
    expect(serverDefaults["/asset_platforms"]).toBeUndefined();
    expect(buildQuery("/asset_platforms", {})).toEqual({});
  });
});
