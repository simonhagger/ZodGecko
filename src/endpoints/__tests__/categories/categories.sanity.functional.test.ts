/**
 * @file Sanity functional tests for the Coins API — Categories routes.
 * @summary Guards `{}` → `{}` serialization and lack of server defaults.
 * @remarks
 * Routes covered:
 * - GET /coins/categories
 * - GET /coins/categories/list
 * - Purpose: fail fast if defaults or schemas change unexpectedly.
 * @see ./docs/categories.functional.testing.md
 */

import { describe, it } from "vitest";

import { expectNoDefaultsAndEmptyQuery } from "../_utils/index.js";

describe("categories – sanity", () => {
  it("/coins/categories/list", () => {
    expectNoDefaultsAndEmptyQuery("/coins/categories/list");
  });
  it("/coins/categories", () => {
    expectNoDefaultsAndEmptyQuery("/coins/categories");
  });
});
