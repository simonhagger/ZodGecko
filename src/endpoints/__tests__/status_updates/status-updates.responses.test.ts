/**
 * @file Response schema tests for the Status Updates API.
 * @summary Parses fixtures and proves tolerance to unknown fields.
 * @remarks
 * Route covered:
 * - GET /status_updates
 * @see ./docs/status-updates.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import fixture from "./fixtures/status-updates.response.json" with { type: "json" };
import { status_updates } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

// Tiny zod guard to validate an item shape without unsafe access
const ItemHasCategoryAndCreatedAt = z.object({
  category: z.string().min(1),
  created_at: z.string().min(1),
});

describe("status_updates.responses (fixtures)", () => {
  it("parses /status_updates fixture; essentials validate", () => {
    const parsed = status_updates.schemas.StatusUpdatesResponseSchema.parse(fixture as unknown);
    // many schemas wrap rows under { status_updates: [...] }
    const root = parsed as Record<string, unknown>;
    const list = (root["status_updates"] ?? []) as unknown[];
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(ItemHasCategoryAndCreatedAt.safeParse(list[0]).success).toBe(true);
  });
});

describe("status_updates.responses (tolerance)", () => {
  it("preserves unknown fields on envelope", () => {
    const payload: unknown = {
      status_updates: [
        { category: "general", created_at: "2024-06-01T12:00:00Z", description: "Hello" },
      ],
      some_future_field: { ok: true },
    };
    const parsed = status_updates.schemas.StatusUpdatesResponseSchema.parse(payload);
    const rec = parsed as Record<string, unknown>;
    expect(
      isObjectRecord(rec) && Object.prototype.hasOwnProperty.call(rec, "some_future_field"),
    ).toBe(true);
  });
});
