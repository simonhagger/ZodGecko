/**
 * @file src/endpoints/indexes/index.ts
 * @module indexes
 *
 * Public surface for the Indexes endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `indexes.schemas`.
 */

export type { IndexesRequest, IndexByIdRequest, IndexesListRequest } from "./requests.js";

export type {
  IndexesResponse,
  IndexByIdResponse,
  IndexesListResponse,
  IndexRow,
  IndexesListItem,
} from "./responses.js";

export * as schemas from "./schemas.js";
