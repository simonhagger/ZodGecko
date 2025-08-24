/**
 * @file src/endpoints/status_updates/schemas.ts
 * @module status_updates.schemas
 *
 * Zod schemas for the Status Updates endpoint family.
 * Covers:
 *   - GET /status_updates
 *   - GET /coins/{id}/status_updates
 *
 * Notes
 * - Requests support pagination via shared `Pagination` (per_page, page).
 * - Response is an envelope with `status_updates` array; we keep it tolerant to
 *   absorb upstream changes (and optional pagination echo if present).
 */

import { z } from "zod";

import { Pagination, tolerantObject, CoinId, UrlString } from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /status_updates
 * @summary Global feed of status updates with optional filters.
 * @params
 *   - category?: string (e.g. "general", "milestone", "exchange_listing")
 *   - project_type?: string (e.g. "coin", "market")
 *   - per_page (default 100), page (default 1)
 */
export const StatusUpdatesRequestSchema = z
  .object({
    category: z.string().optional(),
    project_type: z.string().optional(),
    ...Pagination.shape,
  })
  .strict();

/**
 * @endpoint GET /coins/{id}/status_updates
 * @summary Status updates for a specific coin.
 * @params
 *   - id: CoinId
 *   - per_page (default 100), page (default 1)
 */
export const CoinStatusUpdatesRequestSchema = z
  .object({
    id: CoinId,
    ...Pagination.shape,
  })
  .strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * Individual status update entry (tolerant).
 */
export const StatusUpdateSchema = tolerantObject({
  description: z.string().optional(),
  category: z.string().optional(),
  created_at: z.string().optional(), // ISO-ish; API isn't strict, so keep as string
  user: z.string().optional(),
  user_title: z.string().optional(),
  pin: z.boolean().optional(),
  project: z
    .object({
      type: z.string().optional(),
      id: z.string().optional(),
      name: z.string().optional(),
      symbol: z.string().optional(),
      image: UrlString.optional(),
    })
    .partial()
    .optional(),
});

/**
 * Envelope for status updates.
 * Some payloads may not include pagination echoes; keep tolerant.
 */
export const StatusUpdatesResponseSchema = tolerantObject({
  status_updates: z.array(StatusUpdateSchema),
});
