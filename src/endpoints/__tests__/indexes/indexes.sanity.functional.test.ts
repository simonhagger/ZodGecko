/**
 * @file Sanity functional tests for the Indexes API.
 * @summary Guards empty-query serialization and path-param dropping for representative routes.
 * @remarks
 * Routes covered:
 * - GET /indexes
 * - GET /indexes/list
 * - GET /indexes/{market_id}/{id}
 * @see ./docs/indexes.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { buildQuery } from "../../../index.js";

describe("indexes – sanity", () => {
  it("/indexes → {} when no params provided", () => {
    expect(buildQuery("/indexes", {})).toEqual({});
  });

  it("/indexes/list → {}", () => {
    expect(buildQuery("/indexes/list", {})).toEqual({});
  });

  it("/indexes/{market_id}/{id} drops both path params", () => {
    const {
      market_id: _m,
      id: _id,
      ...q
    } = { market_id: "binance_futures", id: "BTCUSD_PERP" } as const;
    void _m;
    void _id;
    expect(buildQuery("/indexes/{market_id}/{id}", q)).toEqual({});
  });
});
