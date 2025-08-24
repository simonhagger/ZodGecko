/**
 * @file src/endpoints/ping/index.ts
 * @module ping
 *
 * Public surface for the Ping endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `ping.schemas`.
 */

export type { PingRequest } from "./requests.js";
export type { PingResponse } from "./responses.js";

export * as schemas from "./schemas.js";
