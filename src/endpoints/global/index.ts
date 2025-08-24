/**
 * @file index.ts
 * @module endpoints/global
 *
 * Barrel export for the Global endpoints group.
 */

export * as schemas from "./schemas.js";
export type { GlobalRequest, GlobalDefiRequest } from "./requests.js";
export type { GlobalResponse, GlobalDefiResponse } from "./responses.js";
