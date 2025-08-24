/**
 * @file src/endpoints/companies/schemas.ts
 * @module companies.schemas
 *
 * Zod schemas for the Companies endpoint group.
 * Covers:
 *   - GET /companies/public_treasury/{coin_id}
 *
 * Notes
 * - Currently only supports `bitcoin` and `ethereum` for coin_id.
 * - Response is tolerant to absorb new upstream fields.
 *
 * Testing
 * - Put tests in: `src/endpoints/companies/__tests__/`
 *   - requests.test.ts → parse + buildQuery roundtrip
 *   - responses.test.ts → parse fixture responses
 */

import { z } from "zod";

import { tolerantObject, NonEmptyString, UrlString, NullableNumber } from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /companies/public_treasury/{coin_id}
 * @summary Companies holding a given coin in treasury.
 */
export const CompaniesTreasuryRequestSchema = z
  .object({
    coin_id: z.enum(["bitcoin", "ethereum"]),
  })
  .strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * Individual company entry in the response.
 * Fields may be nullable depending on reporting quality.
 */
export const CompanySchema = tolerantObject({
  name: NonEmptyString,
  symbol: NonEmptyString.optional(),
  country: NonEmptyString.optional(),
  total_holdings: NullableNumber,
  total_entry_value_usd: NullableNumber,
  total_current_value_usd: NullableNumber,
  percentage_of_supply: NullableNumber,
  image: UrlString.optional(),
});

/**
 * @endpoint GET /companies/public_treasury/{coin_id}
 * Array of companies with their treasury holdings.
 */
export const CompaniesTreasuryResponseSchema = z.array(CompanySchema);
