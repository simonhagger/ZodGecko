/**
 * @file Sanity functional tests for the Asset Platforms API.
 * @summary Guards `{}` → `{}` serialization and lack of server defaults.
 * @remarks
 * Routes covered:
 * - GET /asset_platforms
 * @see ./docs/asset-platforms.functional.testing.md
 */

import { describe, it } from "vitest";

import { expectNoDefaultsAndEmptyQuery } from "../_utils/test-helpers.js";

describe("asset_platforms – sanity", () => {
  it("/asset_platforms → no defaults; {} → {}", () => {
    expectNoDefaultsAndEmptyQuery("/asset_platforms");
  });
});
