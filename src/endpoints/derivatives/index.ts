/**
 * @file src/endpoints/derivatives/index.ts
 * @module derivatives
 *
 * Public surface for the Derivatives endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `derivatives.schemas`.
 */

export type {
  DerivativesRequest,
  DerivativesExchangesRequest,
  DerivativesExchangesListRequest,
  DerivativesExchangesByIdRequest,
} from "./requests.js";

export type {
  DerivativesResponse,
  DerivativesExchangesResponse,
  DerivativesExchangesListResponse,
  DerivativesExchangesByIdResponse,
  DerivativesRow,
  DerivativesExchangesRow,
  DerivativesExchangesListItem,
} from "./responses.js";

export * as schemas from "./schemas.js";
