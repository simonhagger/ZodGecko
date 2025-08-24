/**
 * @file Sanity functional tests for the Ping API.
 * @summary Guards `{}` → `{}` serialization for the no-param route.
 * @remarks
 * Routes covered:
 * - GET /ping
 * @see ./docs/ping.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { buildQuery } from "../../../index.js";

describe("ping – sanity", () => {
  it("/ping → {}", () => {
    expect(buildQuery("/ping", {})).toEqual({});
  });
});
