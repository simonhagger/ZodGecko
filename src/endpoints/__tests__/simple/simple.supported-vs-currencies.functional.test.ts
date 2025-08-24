/**
 * @file Functional tests for Simple — /simple/supported_vs_currencies.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /simple/supported_vs_currencies
 * @see ./docs/simple.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { simple, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type VsReqIn = z.input<typeof simple.schemas.SupportedVsCurrenciesRequestSchema>;

describe("simple.supported_vs_currencies – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: VsReqIn = {};
    expectValid(simple.schemas.SupportedVsCurrenciesRequestSchema, req);
    expect(buildQuery("/simple/supported_vs_currencies", req)).toEqual({});
  });
});
