/**
 * @file Functional tests for Derivatives — /derivatives/exchanges/{id}.
 * @summary Ensures the path param is not serialized (drop before buildQuery).
 * @remarks
 * Route covered:
 * - GET /derivatives/exchanges/{id}
 * - Pattern: drop path params; {} → {}
 * @see ./docs/derivatives.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { derivatives, buildQuery } from "../../../index.js";
import { dropId, expectValid } from "../_utils/index.js";

type ByIdReqIn = z.input<typeof derivatives.schemas.DerivativesExchangesByIdRequestSchema>;

describe("derivatives.exchanges.byId – functional", () => {
  it("drops {id} before serialization", () => {
    const req: ByIdReqIn = { id: "binance_futures" };
    expectValid(derivatives.schemas.DerivativesExchangesByIdRequestSchema, req);
    const q = dropId(req);
    expect(buildQuery("/derivatives/exchanges/{id}", q)).toEqual({});
  });
});
