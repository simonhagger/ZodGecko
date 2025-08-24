/**
 * @file Sanity functional tests for the Global API.
 * @summary Guards `{}` → `{}` serialization for no-param routes.
 * @remarks
 * Routes covered:
 * - GET /global
 * - GET /global/decentralized_finance_defi
 * @see ./docs/global.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { buildQuery } from "../../../index.js";

describe("global – sanity", () => {
  it("/global → {}", () => {
    expect(buildQuery("/global", {})).toEqual({});
  });

  it("/global/decentralized_finance_defi → {}", () => {
    expect(buildQuery("/global/decentralized_finance_defi", {})).toEqual({});
  });
});
