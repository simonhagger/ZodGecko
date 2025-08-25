/**
 * @file src/endpoints/derivatives/requests.ts
 * @module derivatives.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  DerivativesRequestSchema,
  DerivativesExchangesRequestSchema,
  DerivativesExchangesListRequestSchema,
  DerivativesExchangesByIdRequestSchema,
} from "./schemas.js";

/** Type for `GET /derivatives` request. */
export type DerivativesRequest = z.infer<typeof DerivativesRequestSchema>;

/** Type for `GET /derivatives/exchanges` request. */
export type DerivativesExchangesRequest = z.infer<typeof DerivativesExchangesRequestSchema>;

/** Type for `GET /derivatives/exchanges/list` request. */
export type DerivativesExchangesListRequest = z.infer<typeof DerivativesExchangesListRequestSchema>;

/** Type for `GET /derivatives/exchanges/{id}` request. */
export type DerivativesExchangesByIdRequest = z.infer<typeof DerivativesExchangesByIdRequestSchema>;
