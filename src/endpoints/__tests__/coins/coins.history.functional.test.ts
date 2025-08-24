/**
 * @file Functional tests for the coins/{id}/history endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { coins, buildQuery } from "../../../index.js";
import { dropId } from "../_utils/index.js";

type HistoryRequestInput = z.input<typeof coins.schemas.HistoryRequestSchema>;

describe("coins.history – functional", () => {
  it("validates date format and serializes boolean", () => {
    const req: HistoryRequestInput = {
      id: "bitcoin",
      date: "24-12-2024",
      localization: false,
    };

    // runtime validation (no unsafe assignment)
    expect(() => coins.schemas.HistoryRequestSchema.parse(req)).not.toThrow();

    // strip path param for query building
    const q = dropId(req);

    expect(buildQuery("/coins/{id}/history", q)).toEqual({
      date: "24-12-2024",
      localization: "false",
    });
  });

  it("rejects ISO date (yyyy-mm-dd) per schema", () => {
    const bad: HistoryRequestInput = {
      id: "bitcoin",
      date: "2024-12-24",
    };
    expect(() => coins.schemas.HistoryRequestSchema.parse(bad)).toThrow();
  });
});
