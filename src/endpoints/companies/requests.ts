/**
 * @file src/endpoints/companies/requests.ts
 * @module companies.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { CompaniesTreasuryRequestSchema } from "./schemas.js";

/** Type for `GET /companies/public_treasury/{coin_id}` request. */
export type CompaniesTreasuryRequest = z.infer<typeof CompaniesTreasuryRequestSchema>;
