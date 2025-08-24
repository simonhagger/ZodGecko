/**
 * @file Sanity functional tests for the Simple endpoints.
 * @summary Ensures stable empty-query behavior on no-param routes.
 * @remarks
 * Routes sanity-checked:
 * - GET /simple/supported_vs_currencies
 */

import { describe, it, expect } from "vitest";

import { buildQuery } from "../../../index.js";

describe("simple – sanity", () => {
  it("/simple/supported_vs_currencies → {}", () => {
    expect(buildQuery("/simple/supported_vs_currencies", {})).toEqual({});
  });
});
