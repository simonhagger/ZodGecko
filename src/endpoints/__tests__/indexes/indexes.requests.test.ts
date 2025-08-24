/**
 * @file Request schema tests for the Indexes API.
 * @summary Validates enum/pagination where present and strict no-param routes.
 * @remarks
 * Routes covered:
 * - GET /indexes
 * - GET /indexes/list
 * - GET /indexes/{market_id}/{id}
 * @see ./docs/indexes.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { indexes, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid, dropPathParamsTyped } from "../_utils/index.js";

type IndexesReqIn = z.input<typeof indexes.schemas.IndexesRequestSchema>;
type ListReqIn = z.input<typeof indexes.schemas.IndexesListRequestSchema>;
type ByIdReqIn = z.input<typeof indexes.schemas.IndexByIdRequestSchema>;

describe("indexes.requests", () => {
  it("GET /indexes: pagination accepted; numbers→strings in query", () => {
    const req: IndexesReqIn = { per_page: 50, page: 2 };
    const parsed = indexes.schemas.IndexesRequestSchema.parse(req);
    expect(buildQuery("/indexes", parsed)).toEqual({ per_page: "50", page: "2" });
  });

  it("GET /indexes: rejects invalid pagination", () => {
    expectInvalid(indexes.schemas.IndexesRequestSchema, { per_page: 0, page: -1 });
  });

  it("GET /indexes/list: no params", () => {
    const req: ListReqIn = {};
    expectValid(indexes.schemas.IndexesListRequestSchema, req);
    expect(buildQuery("/indexes/list", req)).toEqual({});
  });

  it("GET /indexes/{market_id}/{id}: both path params are dropped", () => {
    const req: ByIdReqIn = { market_id: "binance_futures", id: "BTCUSD_PERP" };
    expectValid(indexes.schemas.IndexByIdRequestSchema, req);
    const q = dropPathParamsTyped(req, ["market_id", "id"] as const);
    expect(buildQuery("/indexes/{market_id}/{id}", q)).toEqual({});
  });
});
