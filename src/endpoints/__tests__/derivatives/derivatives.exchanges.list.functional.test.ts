/**
 * @file Functional tests for Derivatives — /derivatives/exchanges/list.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /derivatives/exchanges/list
 * - Pattern: {} → {}
 * @see ./docs/derivatives.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { derivatives, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type ExListReqIn = z.input<typeof derivatives.schemas.DerivativesExchangesListRequestSchema>;

describe("derivatives.exchanges.list – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: ExListReqIn = {};
    expectValid(derivatives.schemas.DerivativesExchangesListRequestSchema, req);
    expect(buildQuery("/derivatives/exchanges/list", req)).toEqual({});
  });
});
