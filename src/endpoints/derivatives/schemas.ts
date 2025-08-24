/**
 * @file src/endpoints/derivatives/schemas.ts
 * @module derivatives.schemas
 *
 * Zod schemas for the Derivatives endpoint group.
 * Covers:
 *   - GET /derivatives
 *   - GET /derivatives/exchanges
 *   - GET /derivatives/exchanges/list
 *   - GET /derivatives/exchanges/{id}
 *
 * Notes
 * - `exchanges` list supports ordering + pagination via shared fragments.
 * - Response rows are tolerant to absorb upstream additions safely.
 * - Place tests in: `src/endpoints/derivatives/__tests__/`.
 */

import { z } from "zod";

import { tolerantObject, Pagination, DerivativesExchangesOrder } from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/** @endpoint GET /derivatives */
export const DerivativesRequestSchema = z.object({}).strict();

/**
 * @endpoint GET /derivatives/exchanges
 * @summary Paginated list of derivative exchanges with ordering.
 */
export const DerivativesExchangesRequestSchema = z
  .object({
    order: DerivativesExchangesOrder, // default lives in common.ts
    ...Pagination.shape, // per_page + page (defaults in common.ts)
  })
  .strict();

/** @endpoint GET /derivatives/exchanges/list */
export const DerivativesExchangesListRequestSchema = z.object({}).strict();

/** @endpoint GET /derivatives/exchanges/{id} */
export const DerivativesExchangeByIdRequestSchema = z
  .object({
    id: z.string(),
  })
  .strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * Row for /derivatives
 * Captures common fields across providers; remains tolerant to new ones.
 */
export const DerivativeRowSchema = tolerantObject({
  market: z.string().optional(), // e.g., "binance_futures"
  symbol: z.string().optional(), // e.g., "BTCUSD_PERP"
  price: z.number().nullable().optional(),
  index_id: z.string().nullable().optional(),
  basis: z.number().nullable().optional(),
  spread: z.number().nullable().optional(),
  funding_rate: z.number().nullable().optional(),
  open_interest_usd: z.number().nullable().optional(),
  volume_24h_usd: z.number().nullable().optional(),
  last_traded_at: z.number().nullable().optional(), // seconds epoch
});
/** Array of /derivatives rows. */
export const DerivativesResponseSchema = z.array(DerivativeRowSchema);

/**
 * Exchange row used by /derivatives/exchanges and /{id}.
 * Some metrics may be null depending on the venue.
 */
export const DerivativesExchangeRowSchema = tolerantObject({
  id: z.string().optional(),
  name: z.string().optional(),
  year_established: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  // Metrics
  open_interest_btc: z.number().nullable().optional(),
  trade_volume_24h_btc: z.number().nullable().optional(),
  number_of_perpetual_pairs: z.number().nullable().optional(),
  number_of_futures_pairs: z.number().nullable().optional(),
  // Present on /{id}:
  tickers: z.array(z.unknown()).optional(),
});
/** Array of exchange rows. */
export const DerivativesExchangesResponseSchema = z.array(DerivativesExchangeRowSchema);

/** Minimal listing item for /derivatives/exchanges/list. */
export const DerivativesExchangesListItemSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
});
/** Array of minimal listing items. */
export const DerivativesExchangesListResponseSchema = z.array(DerivativesExchangesListItemSchema);

/** Detail response for /derivatives/exchanges/{id}. */
export const DerivativesExchangeByIdResponseSchema = DerivativesExchangeRowSchema;
