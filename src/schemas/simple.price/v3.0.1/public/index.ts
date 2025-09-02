/**
 * @file src/schemas/simple.price/v3.0.1/index.ts
 * @module schemas/simple.price/v3.0.1/index
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for simple.price */
export { requestSchema } from "./request.js";
/** Response schema for simple.price */
export { responseSchema } from "./response.js";
/** Request type for simple.price */
export type Request = z.infer<typeof requestSchema>;
/** Response type for simple.price */
export type Response = z.infer<typeof responseSchema>;
