/**
 * @file src/endpoints/search/responses.ts
 * @module search.responses
 *
 * Type aliases for Search endpoint responses.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  SearchResponseSchema,
  SearchTrendingResponseSchema,
  SearchCoinSchema,
  SearchExchangeSchema,
  SearchCategorySchema,
  SearchNftSchema,
  SearchTrendingItemSchema,
  SearchTrendingCoinSchema,
} from "./schemas.js";

/** Type for GET /search response. */
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/** Type for GET /search/trending response. */
export type SearchTrendingResponse = z.infer<typeof SearchTrendingResponseSchema>;

/** Item types (handy for tests and UI) */

/** Search coin item type */
export type SearchCoin = z.infer<typeof SearchCoinSchema>;
/** Search exchange item type */
export type SearchExchange = z.infer<typeof SearchExchangeSchema>;
/** Search category item type */
export type SearchCategory = z.infer<typeof SearchCategorySchema>;
/** Search NFT item type */
export type SearchNft = z.infer<typeof SearchNftSchema>;
/** Search trending item type */
export type SearchTrendingItem = z.infer<typeof SearchTrendingItemSchema>;
/** Search trending coin item type */
export type SearchTrendingCoin = z.infer<typeof SearchTrendingCoinSchema>;
