/**
 * @file src/schemas/ping/v3.0.1/index.ts
 * @module schemas/ping/v3.0.1/index
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for ping */
export { requestSchema } from "./request.js";
/** Response schema for ping */
export { responseSchema } from "./response.js";
/** Request type for ping */
export type Request = z.infer<typeof requestSchema>;
/** Response type for ping */
export type Response = z.infer<typeof responseSchema>;
