/**
 * @file src/endpoints/companies/responses.ts
 * @module companies.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { CompaniesTreasuryResponseSchema, CompanySchema } from "./schemas.js";

/** Type for a single company record in /companies/public_treasury. */
export type Company = z.infer<typeof CompanySchema>;

/** Type for `GET /companies/public_treasury/{coin_id}` response. */
export type CompaniesTreasuryResponse = z.infer<typeof CompaniesTreasuryResponseSchema>;
