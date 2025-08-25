/**
 * @file Functional tests for Exchanges — /exchanges/{id}/tickers.
 * @summary Verifies CSV normalization, booleans→"true"/"false", pagination numbers→strings; keeps provided order enum.
 * @remarks
 * Route covered:
 * - GET /exchanges/{id}/tickers
 * - Pattern: drop {id} before buildQuery; array→CSV (dedupe + sort).
 * @see ./docs/exchanges.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { exchanges, buildQuery } from "../../../index.js";
import { dropId, expectValid } from "../_utils/index.js";

type TickersReqIn = z.input<typeof exchanges.schemas.ExchangesByIdTickersRequestSchema>;

describe("exchanges.tickers – functional", () => {
  it("normalizes CSV, booleans, and pagination; keeps provided order", () => {
    const req: TickersReqIn = {
      id: "binance",
      coin_ids: ["eth", "btc", "eth"], // CSV → dedupe + sort → "btc,eth"
      include_exchange_logo: true, // boolean → "true"
      page: 2, // number → "2"
      depth: true, // boolean → "true"
      order: "volume_desc", // valid enum; kept if provided
    };
    // type-safe input
    expectValid(exchanges.schemas.ExchangesByIdTickersRequestSchema, req);

    const q = dropId(req);
    expect(buildQuery("/exchanges/{id}/tickers", q)).toEqual({
      coin_ids: "btc,eth",
      include_exchange_logo: "true",
      page: "2",
      depth: "true",
      order: "volume_desc",
    });
  });
});
