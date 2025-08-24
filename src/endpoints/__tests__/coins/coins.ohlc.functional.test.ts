/**
 * @file Functional tests for the coins/{id}/ohlc endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { coins, buildQuery } from "../../../index.js";
import { dropId } from "../_utils/index.js";

type OhlcRequestInput = z.input<typeof coins.schemas.OhlcRequestSchema>;

describe("coins.ohlc – functional", () => {
  it("serializes days and vs_currency", () => {
    const req: OhlcRequestInput = {
      id: "bitcoin",
      vs_currency: "usd",
      days: "7",
    };

    expect(() => coins.schemas.OhlcRequestSchema.parse(req)).not.toThrow();

    // strip path param for query building
    const q = dropId(req);

    expect(buildQuery("/coins/{id}/ohlc", q)).toEqual({
      vs_currency: "usd",
      days: "7",
    });
  });
});
