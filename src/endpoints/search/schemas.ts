/**
 * @file src/endpoints/search/schemas.ts
 * @module search.schemas
 *
 * Zod schemas for the Search endpoint family.
 * Covers:
 *   - GET /search
 *   - GET /search/trending  ← consolidated here (no separate `trending/` module)
 */

import { z } from "zod";

import { tolerantObject, UrlString } from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /search
 * @summary Requires a query string.
 */
export const SearchRequestSchema = z
  .object({
    query: z.string(),
  })
  .strict();

/**
 * @endpoint GET /search/trending
 * @summary No params; always an empty object.
 */
export const SearchTrendingRequestSchema = z.object({}).strict();

/* ============================================================================
 * Responses — /search
 * ========================================================================== */

export const SearchCoinSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  market_cap_rank: z.number().nullable().optional(),
  thumb: UrlString.optional(),
  large: UrlString.optional(),
  // sometimes: slug, api_symbol, score
  slug: z.string().optional(),
  api_symbol: z.string().optional(),
  score: z.number().nullable().optional(),
});

export const SearchExchangeSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
  market_type: z.string().optional(), // e.g. "spot"
  thumb: UrlString.optional(),
  large: UrlString.optional(),
  year_established: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
});

export const SearchCategorySchema = tolerantObject({
  id: z.string(),
  name: z.string(),
});

export const SearchNftSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  thumb: UrlString.optional(),
});

/** Wrapper for GET /search response. */
export const SearchResponseSchema = z
  .object({
    coins: z.array(SearchCoinSchema),
    exchanges: z.array(SearchExchangeSchema),
    categories: z.array(SearchCategorySchema).optional(),
    nfts: z.array(SearchNftSchema).optional(),
  })
  .catchall(z.unknown());

/* ============================================================================
 * Responses — /search/trending
 * ========================================================================== */

export const SearchTrendingCoinSchema = tolerantObject({
  id: z.string(),
  coin_id: z.number().nullable().optional(),
  name: z.string(),
  symbol: z.string(),
  market_cap_rank: z.number().nullable().optional(),
  thumb: UrlString.optional(),
  small: UrlString.optional(),
  large: UrlString.optional(),
  slug: z.string().optional(),
  price_btc: z.number().nullable().optional(),
  score: z.number().nullable().optional(),
});

export const SearchTrendingItemSchema = tolerantObject({
  item: SearchTrendingCoinSchema,
});

/** Wrapper for GET /search/trending response. */
export const SearchTrendingResponseSchema = z
  .object({
    coins: z.array(SearchTrendingItemSchema),
    // some payloads also include exchanges; keep tolerant:
    exchanges: z.array(SearchExchangeSchema).optional(),
  })
  .catchall(z.unknown());
