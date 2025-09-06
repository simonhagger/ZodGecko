/**
 * @file src/schemas/token_lists.by-asset_platform_id.all.json/v3.0.1/public/index.ts
 * @module schemas/token_lists.by-asset_platform_id.all.json/v3.0.1/public/index
 * @summary Index.
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for token_lists.by-asset_platform_id.all.json */
export { requestSchema } from "./request.js";
/** Response schema for token_lists.by-asset_platform_id.all.json */
export { responseSchema } from "./response.js";
/** Request type for token_lists.by-asset_platform_id.all.json */
export type Request = z.infer<typeof requestSchema>;
/** Response type for token_lists.by-asset_platform_id.all.json */
export type Response = z.infer<typeof responseSchema>;

/** meta data for token_lists.by-asset_platform_id.all.json */
export const meta = {
  pathTemplate: "token_lists/{asset_platform_id}/all.json",
  method: "GET", // optional (defaults to GET)
} as const;
