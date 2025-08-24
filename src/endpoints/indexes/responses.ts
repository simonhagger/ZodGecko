/**
 * @file src/endpoints/indexes/responses.ts
 * @module indexes.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  IndexesResponseSchema,
  IndexByIdResponseSchema,
  IndexesListResponseSchema,
  IndexRowSchema,
  IndexesListItemSchema,
} from "./schemas.js";

/** Row type for an index. */
export type IndexRow = z.infer<typeof IndexRowSchema>;

/** Type for `GET /indexes` response. */
export type IndexesResponse = z.infer<typeof IndexesResponseSchema>;

/** Type for `GET /indexes/{market_id}/{id}` response. */
export type IndexByIdResponse = z.infer<typeof IndexByIdResponseSchema>;

/** Item type for minimal index list. */
export type IndexesListItem = z.infer<typeof IndexesListItemSchema>;

/** Type for `GET /indexes/list` response. */
export type IndexesListResponse = z.infer<typeof IndexesListResponseSchema>;
