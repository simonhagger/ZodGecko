/**
 * @file src/endpoints/categories/schemas.ts
 * @module categories.schemas
 *
 * Zod schemas for the Categories endpoint group.
 * Covers:
 *   - GET /coins/categories
 *   - GET /coins/categories/list
 *
 * Notes
 * - These endpoints take no query params on the public API.
 * - Response rows are kept tolerant to absorb upstream additions without breakage.
 * - Tests should live in: `src/endpoints/categories/__tests__/`.
 *
 * See also
 * - ../../common.ts            Shared helpers (e.g., tolerantObject)
 * - ../../query.ts             Query serialization (not used here)
 * - ../../server-defaults.ts   Documented server defaults (not used here)
 * - ../index.ts                Barrel exporting this module as `categories`
 */

import { z } from "zod";

import { NonEmptyString, tolerantObject } from "../../index.js";

/** @endpoint GET /coins/categories/list */
export const CoinsCategoriesListRequestSchema = z.object({}).strict();

/** @endpoint GET /coins/categories */
export const CoinsCategoriesRequestSchema = z.object({}).strict();

/**
 * Minimal category list item.
 *
 * @returns CoinsCategoriesListItemSchema
 * @example
 * import { categories } from "ZodGecko/endpoints";
 * const item = categories.schemas.CoinsCategoriesListItemSchema.parse({ id: "depin", name: "DePIN" });
 */
export const CoinsCategoriesListItemSchema = tolerantObject({
  id: z.string(),
  name: z.string(),
});

/** Array of minimal list items. */
export const CoinsCategoriesListResponseSchema = z.array(CoinsCategoriesListItemSchema);

/**
 * Rich category row with market metrics (tolerant).
 *
 * @returns CoinsCategoryRowSchema
 * @example
 * import { categories } from "ZodGecko/endpoints";
 * const row = categories.schemas.CoinsCategoryRowSchema.parse({
 *   id: "layer-2",
 *   name: "Layer 2",
 *   market_cap: 123456789,
 *   top_3_coins: ["bitcoin", "ethereum", "ripple"],
 * });
 */
export const CoinsCategoryRowSchema = tolerantObject({
  id: NonEmptyString,
  name: NonEmptyString.optional(),
  market_cap: z.number().optional(),
  market_cap_change_24h: z.number().optional(),
  content: z.unknown().optional(),
  top_3_coins: z.array(z.string()).optional(),
  volume_24h: z.number().optional(),
  updated_at: z.string().optional(),
});

/** Array of rich category rows. */
export const CoinsCategoriesResponseSchema = z.array(CoinsCategoryRowSchema);
