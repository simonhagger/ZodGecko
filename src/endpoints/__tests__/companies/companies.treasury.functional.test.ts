/**
 * @file Functional tests for the companies/public_treasury/{coin_id} endpoint.
 * @remarks
 * - Runtime: Vitest.
 * - Style: unknown-safe parsing + helper utilities.
 * @see ./docs/companies.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { companies, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

type TreasuryReqIn = z.input<typeof companies.schemas.CompaniesTreasuryRequestSchema>;

describe("companies.treasury – functional", () => {
  it("accepts bitcoin and builds an empty query (no query params)", () => {
    const req: TreasuryReqIn = { coin_id: "bitcoin" };
    expectValid(companies.schemas.CompaniesTreasuryRequestSchema, req);

    // drop path param for serialization
    const { coin_id: _id, ...q } = req;
    void _id;
    expect(buildQuery("/companies/public_treasury/{coin_id}", q)).toEqual({});
  });

  it("rejects unsupported coin ids", () => {
    expectInvalid(companies.schemas.CompaniesTreasuryRequestSchema, { coin_id: "dogecoin" });
  });
});
