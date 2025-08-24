/**
 * @file Functional tests for Global — /global.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /global
 * - Pattern: {} → {}
 * @see ./docs/global.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { global as globalNs, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type GlobalReqIn = z.input<typeof globalNs.schemas.GlobalRequestSchema>;

describe("global – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: GlobalReqIn = {};
    expectValid(globalNs.schemas.GlobalRequestSchema, req);
    expect(buildQuery("/global", req)).toEqual({});
  });
});
