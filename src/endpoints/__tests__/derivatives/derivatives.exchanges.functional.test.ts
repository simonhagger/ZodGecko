/**
 * @file Functional tests for the derivatives/exchanges endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/derivatives.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { buildQuery, derivatives } from "../../../index.js";

type ExchangesReqIn = z.input<typeof derivatives.schemas.DerivativesExchangesRequestSchema>;

describe("derivatives.exchanges – functional", () => {
  it("serializes enum order and pagination to strings", () => {
    const req: ExchangesReqIn = {
      order: "name_asc", // valid DerivativesExchangesOrder
      per_page: 50,
      page: 2,
    };
    // parse() for type-safety (will throw if enum invalid)
    const parsed = derivatives.schemas.DerivativesExchangesRequestSchema.parse(req);

    expect(buildQuery("/derivatives/exchanges", parsed)).toEqual({
      order: "name_asc",
      per_page: "50",
      page: "2",
    });
  });
});
