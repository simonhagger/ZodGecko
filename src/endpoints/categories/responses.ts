/**
 * @file src/endpoints/categories/responses.ts
 * @module categories.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  CoinsCategoriesListResponseSchema,
  CoinsCategoriesResponseSchema,
  CoinsCategoriesListItemSchema,
  CoinsCategoryRowSchema,
} from "./schemas.js";

/** Type for `GET /coins/categories/list` response. */
export type CoinsCategoriesListResponse = z.infer<typeof CoinsCategoriesListResponseSchema>;

/** Type for `GET /coins/categories` response. */
export type CoinsCategoriesResponse = z.infer<typeof CoinsCategoriesResponseSchema>;

/** Item types (useful in app code/tests). */
export type CoinsCategoriesListItem = z.infer<typeof CoinsCategoriesListItemSchema>;
export type CoinsCategoryRow = z.infer<typeof CoinsCategoryRowSchema>;
