/**
 * @file Functional tests for Exchanges — /exchanges/list.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /exchanges/list
 * - Pattern: {} → {}
 * @see ./docs/exchanges.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { exchanges, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type ListReqIn = z.input<typeof exchanges.schemas.ExchangesListRequestSchema>;

describe("exchanges.list – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: ListReqIn = {};
    expectValid(exchanges.schemas.ExchangesListRequestSchema, req);
    expect(buildQuery("/exchanges/list", req)).toEqual({});
  });
});
