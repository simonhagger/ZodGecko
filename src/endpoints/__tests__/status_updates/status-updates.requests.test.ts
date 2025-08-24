/**
 * @file Request schema tests for the Status Updates API.
 * @summary Validates optional enums and pagination; strict against unknown keys.
 * @remarks
 * Route covered:
 * - GET /status_updates
 * @see ./docs/status-updates.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { status_updates, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

type SUReqIn = z.input<typeof status_updates.schemas.StatusUpdatesRequestSchema>;

describe("status_updates.requests", () => {
  it("accepts pagination; numbers→strings in query", () => {
    const req: SUReqIn = { per_page: 50, page: 2 };
    const parsed = status_updates.schemas.StatusUpdatesRequestSchema.parse(req);
    expect(buildQuery("/status_updates", parsed)).toEqual({ per_page: "50", page: "2" });
  });

  it("rejects invalid pagination and unknown keys", () => {
    expectInvalid(status_updates.schemas.StatusUpdatesRequestSchema, { page: 0 });
    expectInvalid(status_updates.schemas.StatusUpdatesRequestSchema, { extra: true } as unknown);
  });

  it("(optional) accepts category/project_type when present", () => {
    const req: SUReqIn = { category: "general", project_type: "coin" } as unknown as SUReqIn;
    // If your schema has specific enums, replace with valid literals from the schema.
    expectValid(status_updates.schemas.StatusUpdatesRequestSchema, req);
    expect(buildQuery("/status_updates", req)).toEqual({
      category: "general",
      project_type: "coin",
    });
  });
});
