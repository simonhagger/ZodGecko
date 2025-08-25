/**
 * @file src/endpoints/derivatives/responses.ts
 * @module derivatives.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  DerivativesResponseSchema,
  DerivativesExchangesResponseSchema,
  DerivativesExchangesListResponseSchema,
  DerivativesExchangesByIdResponseSchema,
  DerivativeRowSchema,
  DerivativesExchangesRowSchema,
  DerivativesExchangesListItemSchema,
} from "./schemas.js";

/** Type for a single /derivatives row. */
export type DerivativesRow = z.infer<typeof DerivativeRowSchema>;
/** Type for `GET /derivatives` response. */
export type DerivativesResponse = z.infer<typeof DerivativesResponseSchema>;

/** Type for a single derivatives exchange row. */
export type DerivativesExchangesRow = z.infer<typeof DerivativesExchangesRowSchema>;
/** Type for `GET /derivatives/exchanges` response. */
export type DerivativesExchangesResponse = z.infer<typeof DerivativesExchangesResponseSchema>;

/** Type for a single derivatives exchange list item. */
export type DerivativesExchangesListItem = z.infer<typeof DerivativesExchangesListItemSchema>;
/** Type for `GET /derivatives/exchanges/list` response. */
export type DerivativesExchangesListResponse = z.infer<
  typeof DerivativesExchangesListResponseSchema
>;

/** Type for `GET /derivatives/exchanges/{id}` response. */
export type DerivativesExchangesByIdResponse = z.infer<
  typeof DerivativesExchangesByIdResponseSchema
>;
