/**
 * @file src/schemas/asset_platforms/v3.0.1/public/index.ts
 * @module schemas/asset_platforms/v3.0.1/public/index
  * @summary Index.
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for asset_platforms */
export { requestSchema } from "./request.js";
/** Response schema for asset_platforms */
export { responseSchema } from "./response.js";
/** Request type for asset_platforms */
export type Request = z.infer<typeof requestSchema>;
/** Response type for asset_platforms */
export type Response = z.infer<typeof responseSchema>;
