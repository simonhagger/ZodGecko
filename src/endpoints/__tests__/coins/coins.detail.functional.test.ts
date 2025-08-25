/**
 * @file Functional tests for the coins/{id} endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { coins, buildQuery } from "../../../index.js";
import { dropPathParams } from "../_utils/index.js";

type CoinDetailInput = z.input<typeof coins.schemas.CoinsByIdRequestSchema>;

describe("coins.detail – functional", () => {
  it("drops params equal to server defaults", () => {
    const req: CoinDetailInput = {
      id: "bitcoin", // ← include path param in schema input
      localization: true,
      tickers: true,
      market_data: true,
      community_data: true,
      developer_data: true,
      sparkline: false,
      // dex_pair_format omitted
    };

    expect(() => coins.schemas.CoinsByIdRequestSchema.parse(req)).not.toThrow();

    const q = dropPathParams("/coins/{id}", req); // ← remove path param for query build
    expect(buildQuery("/coins/{id}", q)).toEqual({});
  });

  it("keeps params that differ from defaults", () => {
    const req: CoinDetailInput = {
      id: "bitcoin",
      localization: false, // default true → keep
      tickers: false, // default true → keep
    };

    expect(() => coins.schemas.CoinsByIdRequestSchema.parse(req)).not.toThrow();

    const q = dropPathParams("/coins/{id}", req);
    expect(buildQuery("/coins/{id}", q)).toEqual({
      localization: "false",
      tickers: "false",
    });
  });
});
