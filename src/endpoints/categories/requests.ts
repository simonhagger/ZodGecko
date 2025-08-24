/**
 * @file src/endpoints/categories/requests.ts
 * @module categories.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { CoinsCategoriesListRequestSchema, CoinsCategoriesRequestSchema } from "./schemas.js";

/** Type for `GET /coins/categories/list` request (no params). */
export type CoinsCategoriesListRequest = z.infer<typeof CoinsCategoriesListRequestSchema>;

/** Type for `GET /coins/categories` request (no params). */
export type CoinsCategoriesRequest = z.infer<typeof CoinsCategoriesRequestSchema>;
