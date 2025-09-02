/**
 * @file src/endpoints/exchanges/schemas.ts
 * @module exchanges.schemas
 *
 * Zod schemas for the Exchanges endpoint group.
 * Covers:
 *   - GET /exchanges
 *   - GET /exchanges/list
 *   - GET /exchanges/{id}
 *   - GET /exchanges/{id}/tickers
 *   - GET /exchanges/{id}/volume_chart
 *
 * Notes
 * - Uses shared `Pagination`, `PageOnly`, `CSList`, and `TickersOrder`.
 * - Response rows are tolerant to upstream additions.
 * - Place tests in: `src/endpoints/exchanges/__tests__/`.
 */

import { z } from "zod";

import {
  tolerantObject,
  Pagination,
  PageOnly,
  CSList,
  TickersOrder,
  TickersEnvelope,
} from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /exchanges
 * @summary Paginated list of exchanges.
 * @params per_page (default 100), page (default 1)
 */
export const ExchangesRequestSchema = z
  .object({
    ...Pagination.shape,
  })
  .strict();

/**
 * @endpoint GET /exchanges/list
 * @summary Minimal id+name list (no params).
 */
export const ExchangesListRequestSchema = z.object({}).strict();

/**
 * @endpoint GET /exchanges/{id}
 * @summary Exchange details (no query params).
 */
export const ExchangesByIdRequestSchema = z
  .object({
    id: z.string(),
  })
  .strict();

/**
 * @endpoint GET /exchanges/{id}/tickers
 * @summary Exchange tickers with optional filters.
 * @params coin_ids (CSV), include_exchange_logo, page, depth, order
 */
export const ExchangesByIdTickersRequestSchema = z
  .object({
    id: z.string(),
    coin_ids: CSList(z.string()).optional(),
    include_exchange_logo: z.boolean().optional(),
    ...PageOnly.shape,
    depth: z.boolean().optional(),
    order: TickersOrder.optional(),
  })
  .strict();

/**
 * @endpoint GET /exchanges/{id}/volume_chart
 * @summary Exchange volume chart for last N days.
 * @params days (int > 0)
 */
export const ExchangesByIdVolumeChartRequestSchema = z
  .object({
    id: z.string(),
    days: z.number().int().positive(),
  })
  .strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * Exchange row used by /exchanges and /exchanges/{id}.
 * Tolerant to absorb extra provider fields.
 */
export const ExchangeRowSchema = tolerantObject({
  id: z.string().optional(),
  name: z.string().optional(),
  year_established: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  has_trading_incentive: z.boolean().nullable().optional(),
  trust_score: z.number().nullable().optional(),
  trust_score_rank: z.number().nullable().optional(),
  trade_volume_24h_btc: z.number().nullable().optional(),
  trade_volume_24h_btc_normalized: z.number().nullable().optional(),
});

/** @returns Array<ExchangeRowSchema> for GET /exchanges */
export const ExchangesResponseSchema = z.array(ExchangeRowSchema);

/** @returns ExchangeRowSchema for GET /exchanges/{id} */
export const ExchangesByIdResponseSchema = ExchangeRowSchema;

/**
 * Minimal listing item for /exchanges/list.
 */
export const ExchangesListItemSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
});

/** @returns Array<ExchangesListItemSchema> */
export const ExchangesListResponseSchema = z.array(ExchangesListItemSchema);

/** Envelope for /exchanges/{id}/tickers (reuses shared TickersEnvelope). */
export const ExchangesByIdTickersResponseSchema = TickersEnvelope;

/**
 * Volume chart points for /exchanges/{id}/volume_chart.
 * Array of [timestampMs, volume] tuples.
 */
export const ExchangesByIdVolumeChartResponseSchema = z.array(z.tuple([z.number(), z.number()]));

/* ============================================================================
 * Example
 * ========================================================================== *
 * @example
 * import { exchanges } from "ZodGecko/endpoints";
 * import { buildQuery } from "ZodGecko";
 *
 * const req = exchanges.schemas.ExchangesRequestSchema.parse({ per_page: 50 });
 * const qs = buildQuery("/exchanges", req);
 * const res = await fetch(`${baseUrl}/exchanges?${new URLSearchParams(qs)}`);
 * const data = exchanges.schemas.ExchangesResponseSchema.parse(await res.json());
 */
