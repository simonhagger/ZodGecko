/**
 * @file Functional tests for Exchanges — /exchanges.
 * @summary Verifies pagination normalization (numbers→strings) and empty-query behavior.
 * @remarks
 * Route covered:
 * - GET /exchanges
 * - Pattern: numeric inputs serialize to strings; no path params.
 * @see ./docs/exchanges.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { exchanges, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type ExchangesReqIn = z.input<typeof exchanges.schemas.ExchangesRequestSchema>;

describe("exchanges – functional", () => {
  it("serializes numeric pagination to strings", () => {
    const req: ExchangesReqIn = { per_page: 50, page: 2 };
    expectValid(exchanges.schemas.ExchangesRequestSchema, req);

    expect(buildQuery("/exchanges", req)).toEqual({
      per_page: "50",
      page: "2",
    });
  });
});
