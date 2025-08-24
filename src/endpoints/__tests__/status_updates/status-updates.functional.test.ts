/**
 * @file Functional tests for Status Updates — /status_updates.
 * @summary Verifies serialization of optional filters and pagination.
 * @remarks
 * Route covered:
 * - GET /status_updates
 * @see ./docs/status-updates.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { status_updates, buildQuery } from "../../../index.js";

type SUReqIn = z.input<typeof status_updates.schemas.StatusUpdatesRequestSchema>;

describe("status_updates – functional", () => {
  it("serializes optional filters and pagination", () => {
    const req: SUReqIn = {
      category: "general",
      project_type: "coin",
      per_page: 25,
      page: 3,
    } as unknown as SUReqIn;
    const parsed = status_updates.schemas.StatusUpdatesRequestSchema.parse(req);
    expect(buildQuery("/status_updates", parsed)).toEqual({
      category: "general",
      project_type: "coin",
      per_page: "25",
      page: "3",
    });
  });

  it("applies pagination defaults (page=1, per_page=100)", () => {
    const empty: SUReqIn = {};
    const parsed = status_updates.schemas.StatusUpdatesRequestSchema.parse(empty);
    expect(buildQuery("/status_updates", parsed)).toEqual({
      page: "1",
      per_page: "100",
    });
  });
});
