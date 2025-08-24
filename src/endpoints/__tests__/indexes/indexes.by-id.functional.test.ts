/**
 * @file Functional tests for Indexes — /indexes/{market_id}/{id}.
 * @summary Ensures composite path params are not serialized.
 * @remarks
 * Route covered:
 * - GET /indexes/{market_id}/{id}
 * - Pattern: drop both {market_id} and {id} before buildQuery
 * @see ./docs/indexes.functional.testing.md
 */
import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { indexes, buildQuery } from "../../../index.js";
import { dropPathParamsTyped, expectValid } from "../_utils/index.js";

type ByIdReqIn = z.input<typeof indexes.schemas.IndexByIdRequestSchema>;

describe("indexes.byId – functional", () => {
  it("drops both path params", () => {
    const req: ByIdReqIn = { market_id: "binance_futures", id: "BTCUSD_PERP" };
    expectValid(indexes.schemas.IndexByIdRequestSchema, req);
    const q = dropPathParamsTyped(req, ["market_id", "id"] as const);
    expect(buildQuery("/indexes/{market_id}/{id}", q)).toEqual({});
  });
});
