/**
 * @file Functional tests for the coins/{id}/tickers endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/coins.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { coins, buildQuery } from "../../../index.js";
import { dropId } from "../_utils/index.js";

describe("coins.tickers – functional", () => {
  it("drops default order, normalizes exchange_ids, keeps non-defaults", () => {
    const req = coins.schemas.CoinTickersRequestSchema.parse({
      id: "bitcoin",
      exchange_ids: ["binance", "kraken", "binance"],
      page: 2,
      order: "trust_score_desc",
      include_exchange_logo: true,
    });
    // strip path param for query building
    const q = dropId(req);
    expect(buildQuery("/coins/{id}/tickers", q)).toEqual({
      exchange_ids: "binance,kraken",
      include_exchange_logo: "true",
      page: "2",
    });
  });
});
