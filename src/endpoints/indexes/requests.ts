/**
 * @file src/endpoints/indexes/requests.ts
 * @module indexes.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  IndexesRequestSchema,
  IndexByIdRequestSchema,
  IndexesListRequestSchema,
} from "./schemas.js";

/** Type for `GET /indexes` request. */
export type IndexesRequest = z.infer<typeof IndexesRequestSchema>;

/** Type for `GET /indexes/{market_id}/{id}` request. */
export type IndexByIdRequest = z.infer<typeof IndexByIdRequestSchema>;

/** Type for `GET /indexes/list` request. */
export type IndexesListRequest = z.infer<typeof IndexesListRequestSchema>;
