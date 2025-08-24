/**
 * @file src/endpoints/search/requests.ts
 * @module search.requests
 *
 * Type aliases for Search endpoint requests.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { SearchRequestSchema, SearchTrendingRequestSchema } from "./schemas.js";

/** Type for GET /search request. */
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

/** Type for GET /search/trending request. */
export type SearchTrendingRequest = z.infer<typeof SearchTrendingRequestSchema>;
