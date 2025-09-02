/**
 * @file src/schemas/coins.by-id.history/v3.0.1/index.ts
 * @module schemas/coins.by-id.history/v3.0.1/index
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for coins.by-id.history */
export { requestSchema } from "./request.js";
/** Response schema for coins.by-id.history */
export { responseSchema } from "./response.js";
/** Request type for coins.by-id.history */
export type Request = z.infer<typeof requestSchema>;
/** Response type for coins.by-id.history */
export type Response = z.infer<typeof responseSchema>;

// /** meta data for coins.by-id.history */
// export const meta = {
//   pathTemplate: "/coins/{id}/history",
//   method: "GET", // optional (defaults to GET)
// } as const;
