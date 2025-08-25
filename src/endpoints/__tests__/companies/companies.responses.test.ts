/**
 * @file Response schema tests for the Companies API — Public Treasury route.
 * @summary Parses fixture and proves tolerance to unknown fields; numeric aggregates may be optional.
 * @remarks
 * Routes covered:
 * - GET /companies/public_treasury/{coin_id}
 * @see ./docs/companies.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import fixture from "./fixtures/companies.treasury.response.json" with { type: "json" };
import { companies } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

// minimal essential-shape checks without reading fields off `unknown`
const RowHasCore = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1).optional(),
  total_holdings: z.number().nullable().optional(),
});

describe("companies.responses", () => {
  it("parses public treasury payload; essentials validate", () => {
    const rows = companies.schemas.CompaniesPublicTreasuryByIdResponseSchema.parse(
      fixture as unknown,
    );

    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    const first = rows[0];
    expect(RowHasCore.safeParse(first).success).toBe(true);
  });

  it("is tolerant to unknown fields (extras preserved)", () => {
    // Build a minimal, schema-compliant row + one extra field.
    // (No fixture mutation, no `any`.)
    const payload: unknown = [
      {
        name: "Example Co",
        symbol: "EXM",
        country: "US",
        total_holdings: 1,
        total_entry_value_usd: 1000,
        total_current_value_usd: 1200,
        percentage_of_supply: 0.0001,
        last_updated: "2024-12-01T00:00:00Z", // include if your schema requires/accepts it
        // extra, not in declared schema:
        some_future_field: { ok: true },
      },
    ];

    const rows = companies.schemas.CompaniesPublicTreasuryByIdResponseSchema.parse(payload);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);

    const first = rows[0];
    expect(
      isObjectRecord(first) && Object.prototype.hasOwnProperty.call(first, "some_future_field"),
    ).toBe(true);
  });
});
