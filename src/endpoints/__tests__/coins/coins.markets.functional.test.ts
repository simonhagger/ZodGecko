/**
 * @file Functional tests for the coins/markets endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { coins, buildQuery } from "../../../index.js";
import { expectInvalid } from "../_utils/index.js";

type MarketsRequestInput = z.input<typeof coins.schemas.CoinsMarketsRequestSchema>;

describe("coins.markets – functional", () => {
  it("minimal happy path keeps vs_currency; drops other defaults", () => {
    const req: MarketsRequestInput = { vs_currency: "usd" };

    // runtime validation only (no unsafe assignment)
    expect(() => coins.schemas.CoinsMarketsRequestSchema.parse(req)).not.toThrow();

    // per-page=100, page=1, order=market_cap_desc, locale=en, sparkline=false all drop by default rules
    expect(buildQuery("/coins/markets", req)).toEqual({ vs_currency: "usd" });
  });

  it("CSV normalization + non-defaults kept", () => {
    const req: MarketsRequestInput = {
      vs_currency: "usd",
      ids: ["ethereum", "bitcoin", "ethereum"], // → "bitcoin,ethereum"
      include_tokens: "all", // default is "top" → keep
      per_page: 50, // default is 100 → keep
      sparkline: true, // default is false → keep
    };

    expect(() => coins.schemas.CoinsMarketsRequestSchema.parse(req)).not.toThrow();

    expect(buildQuery("/coins/markets", req)).toEqual({
      ids: "bitcoin,ethereum",
      include_tokens: "all",
      per_page: "50",
      sparkline: "true",
      vs_currency: "usd",
    });
  });

  it("invalid enums rejected", () => {
    expectInvalid(coins.schemas.CoinsMarketsRequestSchema, {
      vs_currency: "usd",
      order: "definitely_not_valid",
    });
  });
});
