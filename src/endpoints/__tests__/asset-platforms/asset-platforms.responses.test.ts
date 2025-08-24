/**
 * @file Response schema tests for the Asset Platforms API.
 * @summary Parses list fixture and proves unknown-field tolerance.
 * @remarks
 * Routes covered:
 * - GET /asset_platforms
 * @see ./docs/asset-platforms.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import fixture from "./fixtures/asset-platforms.list.response.json" with { type: "json" };
import { assetPlatforms } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

// zod snippets to assert important fields without reading unknown properties directly
const RowHasId = z.object({ id: z.string().min(1) });
const RowHasChainIdentifier = z.object({
  chain_identifier: z.number().nullable().optional(),
});

describe("asset-platforms.responses", () => {
  it("parses /asset_platforms payload (fixture) and essential fields validate", () => {
    const rows = assetPlatforms.schemas.AssetPlatformsResponseSchema.parse(fixture as unknown);

    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);

    const first = rows[0];
    // validate shape via zod (no unsafe property access)
    expect(RowHasId.safeParse(first).success).toBe(true);
    expect(RowHasChainIdentifier.safeParse(first).success).toBe(true);
  });

  it("is tolerant to unknown fields (extra keys allowed & preserved)", () => {
    const payload: unknown = [
      {
        id: "ethereum",
        chain_identifier: 1,
        name: "Ethereum",
        shortname: "ETH",
        // extra, not in declared schema
        some_future_field: { ok: true },
      },
    ];

    const rows = assetPlatforms.schemas.AssetPlatformsResponseSchema.parse(payload);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);

    const first = rows[0];
    // prove extra key survived without indexing into unknown
    expect(
      isObjectRecord(first) && Object.prototype.hasOwnProperty.call(first, "some_future_field"),
    ).toBe(true);
  });
});
