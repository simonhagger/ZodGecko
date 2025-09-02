/**
 * @file src/schemas/simple.token_price.by-id/v3.0.1/index.ts
 * @module schemas/simple.token_price.by-id/v3.0.1/index
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for simple.token_price.by-id */
export { requestSchema } from "./request.js";
/** Response schema for simple.token_price.by-id */
export { responseSchema } from "./response.js";
/** Request type for simple.token_price.by-id */
export type Request = z.infer<typeof requestSchema>;
/** Response type for simple.token_price.by-id */
export type Response = z.infer<typeof responseSchema>;
