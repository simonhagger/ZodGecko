/**
 * @file Sanity functional tests for the Status Updates API.
 * @summary Guards baseline behavior for the no-param request.
 * @remarks
 * Route covered:
 * - GET /status_updates
 * @see ./docs/status-updates.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { buildQuery, status_updates } from "../../../index.js";

describe("status_updates – sanity", () => {
  // Serializer baseline: buildQuery should NOT invent defaults
  it("/status_updates raw {} → {}", () => {
    expect(buildQuery("/status_updates", {})).toEqual({});
  });

  // Endpoint contract: parse applies defaults, then serialize them
  it("/status_updates parsed {} → { page: '1', per_page: '100' }", () => {
    expect(
      buildQuery("/status_updates", status_updates.schemas.StatusUpdatesRequestSchema.parse({})),
    ).toEqual({ page: "1", per_page: "100" });
  });
});
