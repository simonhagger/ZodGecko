/**
 * @file Functional tests for Derivatives — /derivatives.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /derivatives
 * - Pattern: {} → {}
 * @see ./docs/derivatives.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { derivatives, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type ListReqIn = z.input<typeof derivatives.schemas.DerivativesRequestSchema>;

describe("derivatives – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: ListReqIn = {};
    expectValid(derivatives.schemas.DerivativesRequestSchema, req);
    expect(buildQuery("/derivatives", req)).toEqual({});
  });
});
