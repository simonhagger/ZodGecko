/**
 * @file src/endpoints/search/index.ts
 * @module search
 *
 * Public surface for the Search endpoint group.
 * (Includes /search and /search/trending; no standalone `trending/` export.)
 */

export type { SearchRequest, SearchTrendingRequest } from "./requests.js";
export type {
  SearchResponse,
  SearchTrendingResponse,
  SearchCoin,
  SearchExchange,
  SearchCategory,
  SearchNft,
  SearchTrendingItem,
  SearchTrendingCoin,
} from "./responses.js";

export * as schemas from "./schemas.js";
