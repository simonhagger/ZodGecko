/**
 * @file Functional tests for Exchanges — /exchanges/{id}.
 * @summary Ensures the path param is not serialized (drop before buildQuery).
 * @remarks
 * Route covered:
 * - GET /exchanges/{id}
 * - Pattern: drop path params; {} → {}
 * @see ./docs/exchanges.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { exchanges, buildQuery } from "../../../index.js";
import { dropId, expectValid } from "../_utils/index.js";

type ByIdReqIn = z.input<typeof exchanges.schemas.ExchangeByIdRequestSchema>;

describe("exchanges.byId – functional", () => {
  it("drops path param before serialization", () => {
    const req: ByIdReqIn = { id: "binance" };
    expectValid(exchanges.schemas.ExchangeByIdRequestSchema, req);

    const q = dropId(req);
    expect(buildQuery("/exchanges/{id}", q)).toEqual({});
  });
});
