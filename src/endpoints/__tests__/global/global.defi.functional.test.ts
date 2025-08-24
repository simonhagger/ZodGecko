/**
 * @file Functional tests for Global — /global/decentralized_finance_defi.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /global/decentralized_finance_defi
 * - Pattern: {} → {}
 * @see ./docs/global.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { global as globalNs, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type DefiReqIn = z.input<typeof globalNs.schemas.GlobalDefiRequestSchema>;

describe("global.defi – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: DefiReqIn = {};
    expectValid(globalNs.schemas.GlobalDefiRequestSchema, req);
    expect(buildQuery("/global/decentralized_finance_defi", req)).toEqual({});
  });
});
