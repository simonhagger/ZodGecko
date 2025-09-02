/**
 * @file src/schemas/simple.supported_vs_currencies/v3.0.1/index.ts
 * @module schemas/simple.supported_vs_currencies/v3.0.1/index
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for simple.supported_vs_currencies */
export { requestSchema } from "./request.js";
/** Response schema for simple.supported_vs_currencies */
export { responseSchema } from "./response.js";
/** Request type for simple.supported_vs_currencies */
export type Request = z.infer<typeof requestSchema>;
/** Response type for simple.supported_vs_currencies */
export type Response = z.infer<typeof responseSchema>;
