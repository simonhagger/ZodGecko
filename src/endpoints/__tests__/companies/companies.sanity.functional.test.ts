/**
 * @file Sanity functional tests for the Companies API — Public Treasury route.
 * @summary Guards empty-query serialization after dropping path params.
 * @remarks
 * Routes covered:
 * - GET /companies/public_treasury/{coin_id}
 * @see ./docs/companies.functional.testing.md
 */

import { describe, it } from "vitest";

import { expectNoDefaultsAndEmptyQuery } from "../_utils/test-helpers.js";

describe("companies – sanity", () => {
  it("/companies/public_treasury/{coin_id} → no defaults; {} → {}", () => {
    expectNoDefaultsAndEmptyQuery("/companies/public_treasury/{coin_id}");
  });
});
