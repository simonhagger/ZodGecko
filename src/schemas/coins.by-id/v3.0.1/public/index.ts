/**
 * @file src/schemas/coins.by-id/v3.0.1/public/index.ts
 * @module schemas/coins.by-id/v3.0.1/public/index
 * @summary Index.
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for coins.by-id */
export { requestSchema } from "./request.js";
/** Response schema for coins.by-id */
export { responseSchema } from "./response.js";
/** Request type for coins.by-id */
export type Request = z.infer<typeof requestSchema>;
/** Response type for coins.by-id */
export type Response = z.infer<typeof responseSchema>;
