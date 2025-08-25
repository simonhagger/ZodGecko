/**
 * @file Request schema tests for the Companies API — Public Treasury route.
 * @summary Validates path-only request shape.
 * @remarks
 * Routes covered:
 * - GET /companies/public_treasury/{coin_id}
 * @see ./docs/companies.functional.testing.md
 */

import { describe, it } from "vitest";

import { companies } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

describe("companies.requests", () => {
  it("parses valid coin ids", () => {
    expectValid(companies.schemas.CompaniesPublicTreasuryByIdRequestSchema, { coin_id: "bitcoin" });
    expectValid(companies.schemas.CompaniesPublicTreasuryByIdRequestSchema, {
      coin_id: "ethereum",
    });
  });

  it("rejects invalid coin ids", () => {
    expectInvalid(companies.schemas.CompaniesPublicTreasuryByIdRequestSchema, {
      coin_id: "litecoin",
    });
  });
});
