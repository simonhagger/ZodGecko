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

import { NullableNumber, NullableString, tolerantObject, UrlString } from "../../index.js";

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
 * Responses
 * ========================================================================== */

/*
 * Endpoint: /search
 */

/** Search response object when a coin is found */
export const SearchCoinSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  market_cap_rank: NullableNumber.optional(),
  thumb: UrlString.optional(),
  large: UrlString.optional(),
  slug: z.string().optional(),
  api_symbol: z.string().optional(),
  score: NullableNumber.optional(),
});

/** Search response object when an exchange is found */
export const SearchExchangeSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
  market_type: z.string().optional(), // e.g. "spot"
  thumb: UrlString.optional(),
  large: UrlString.optional(),
  year_established: NullableNumber.optional(),
  country: NullableString.optional(),
});

/** Search response object when a category is found */
export const SearchCategorySchema = tolerantObject({
  id: z.string(),
  name: z.string(),
});

/** Search response object when an NFT is found */
export const SearchNftSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  thumb: UrlString.optional(),
});

/**
 * @endpoint GET /search
 * @description Schema for GET /search response.
 */
export const SearchResponseSchema = z
  .object({
    coins: z.array(SearchCoinSchema),
    exchanges: z.array(SearchExchangeSchema),
    categories: z.array(SearchCategorySchema),
    nfts: z.array(SearchNftSchema),
  })
  .catchall(z.unknown());

/*
 * Endpoint: /search/trending
 */

/** Schema for GET /search/trending response. Coin related schema */
export const SearchTrendingCoinSchema = tolerantObject({
  id: z.string(),
  coin_id: NullableNumber.optional(),
  name: z.string(),
  symbol: z.string(),
  market_cap_rank: NullableNumber.optional(),
  thumb: UrlString.optional(),
  small: UrlString.optional(),
  large: UrlString.optional(),
  slug: z.string().optional(),
  price_btc: NullableNumber.optional(),
  score: NullableNumber.optional(),
});

/** Wrapper for each item in the `coins` array in GET /search/trending response. */
export const SearchTrendingItemSchema = tolerantObject({
  item: SearchTrendingCoinSchema,
});

/**
 * @endpoint GET /search/trending
 * @description Schema for GET /search/trending response.
 */
export const SearchTrendingResponseSchema = z
  .object({
    coins: z.array(SearchTrendingItemSchema),
    // some payloads also include exchanges; keep tolerant:
    exchanges: z.array(SearchExchangeSchema).optional(),
  })
  .catchall(z.unknown());
