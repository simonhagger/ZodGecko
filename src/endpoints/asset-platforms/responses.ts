/**
 * @file src/endpoints/asset-platforms/responses.ts
 * @module assetPlatforms.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { AssetPlatformsResponseSchema } from "./schemas.js";

/** Type for `GET /asset_platforms` response (array of platforms) */
export type AssetPlatformsResponse = z.infer<typeof AssetPlatformsResponseSchema>;
