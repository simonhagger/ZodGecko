/**
 * @file src/endpoints/indexes/schemas.ts
 * @module indexes.schemas
 *
 * Zod schemas for the Indexes endpoint group.
 * Covers:
 *   - GET /indexes
 *   - GET /indexes/{market_id}/{id}
 *   - GET /indexes/list
 *
 * Notes
 * - `/indexes` is paginated (uses shared `Pagination` defaults).
 * - Detail endpoint shares the same base row shape (tolerant).
 * - Minimal `/indexes/list` returns id + market (+ sometimes last).
 */

import { z } from "zod";

import { tolerantObject, Pagination } from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /indexes
 * @summary Paginated list of indexes.
 * @params per_page (default 100), page (default 1)
 */
export const IndexesRequestSchema = z
  .object({
    ...Pagination.shape,
  })
  .strict();

/**
 * @endpoint GET /indexes/{market_id}/{id}
 * @summary Fetch a specific index by provider market and identifier.
 */
export const IndexByIdRequestSchema = z
  .object({
    market_id: z.string(),
    id: z.string(),
  })
  .strict();

/**
 * @endpoint GET /indexes/list
 * @summary Minimal list of index identifiers.
 */
export const IndexesListRequestSchema = z.object({}).strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * Base row for index items (tolerant to provider-specific fields).
 */
export const IndexRowSchema = tolerantObject({
  name: z.string().optional(), // e.g., "BTC/USD"
  market: z.string().optional(), // e.g., "binance"
  identifier: z.string().optional(), // provider-specific id
  last: z.number().nullable().optional(),
  is_multi_asset_composite: z.boolean().nullable().optional(),
});

/** Array of index rows for GET /indexes. */
export const IndexesResponseSchema = z.array(IndexRowSchema);

/** Detail response for GET /indexes/{market_id}/{id} (same base shape). */
export const IndexByIdResponseSchema = IndexRowSchema;

/**
 * Minimal item for GET /indexes/list.
 */
export const IndexesListItemSchema = tolerantObject({
  id: z.string(),
  market: z.string(),
  last: z.number().nullable().optional(),
});

/** Array of minimal items for GET /indexes/list. */
export const IndexesListResponseSchema = z.array(IndexesListItemSchema);

/* ============================================================================
 * Example
 * ========================================================================== *
 * @example
 * import { indexes } from "ZodGecko/endpoints";
 * import { buildQuery } from "ZodGecko";
 *
 * const req = indexes.schemas.IndexesRequestSchema.parse({ per_page: 50 });
 * const qs = buildQuery("/indexes", req);
 * const res = await fetch(`${baseUrl}/indexes?${new URLSearchParams(qs)}`);
 * const data = indexes.schemas.IndexesResponseSchema.parse(await res.json());
 */
