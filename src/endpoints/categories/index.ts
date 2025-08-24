/**
 * @file src/endpoints/categories/index.ts
 * @module categories
 *
 * Public surface for the Categories endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `categories.schemas`.
 */

export type { CoinsCategoriesListRequest, CoinsCategoriesRequest } from "./requests.js";
export type {
  CoinsCategoriesListResponse,
  CoinsCategoriesResponse,
  CoinsCategoriesListItem,
  CoinsCategoryRow,
} from "./responses.js";

export * as schemas from "./schemas.js";
