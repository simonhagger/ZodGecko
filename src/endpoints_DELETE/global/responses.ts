/**
 * @file responses.ts
 * @module endpoints/global/responses
 *
 * Re-exports typed response schemas for `/global` and `/global/decentralized_finance_defi`.
 */

// Value exports (runtime)
export { GlobalResponseSchema, GlobalDefiResponseSchema } from "./schemas.js";

// Type exports (compile-time only)
export type { GlobalResponse, GlobalDefiResponse } from "./schemas.js";
