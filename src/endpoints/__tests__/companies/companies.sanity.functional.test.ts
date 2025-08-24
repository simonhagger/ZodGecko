/**
 * @file Sanity functional tests for the Companies API — Public Treasury route.
 * @summary Guards empty-query serialization after dropping path params.
 * @remarks
 * Routes covered:
 * - GET /companies/public_treasury/{coin_id}
 * @see ./docs/companies.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { companies, buildQuery } from "../../../index.js";
import { serverDefaults } from "../../../runtime/server-defaults.js";
import { dropPathParamsTyped, expectValid } from "../_utils/index.js";

type TreasuryReqIn = z.input<typeof companies.schemas.CompaniesTreasuryRequestSchema>;

describe("companies – sanity", () => {
  it("no documented server defaults for /companies/public_treasury/{coin_id}", () => {
    expect(serverDefaults["/companies/public_treasury/{coin_id}"]).toBeUndefined();
  });

  it("building a query from a valid request yields empty object", () => {
    const req: TreasuryReqIn = { coin_id: "bitcoin" };
    expectValid(companies.schemas.CompaniesTreasuryRequestSchema, req);
    const q = dropPathParamsTyped(req, ["coin_id"] as const);
    expect(buildQuery("/companies/public_treasury/{coin_id}", q)).toEqual({});
  });
});
