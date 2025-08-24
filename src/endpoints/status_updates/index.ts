/**
 * @file src/endpoints/status_updates/index.ts
 * @module status_updates
 *
 * Public surface for the Status Updates endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `status_updates.schemas`.
 */

export type { StatusUpdatesRequest, CoinStatusUpdatesRequest } from "./requests.js";
export type { StatusUpdatesResponse, StatusUpdate } from "./responses.js";

export * as schemas from "./schemas.js";
