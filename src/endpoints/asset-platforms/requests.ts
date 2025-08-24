/**
 * @file src/endpoints/asset-platforms/requests.ts
 * @module assetPlatforms.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { AssetPlatformsRequestSchema } from "./schemas.js";

/** Type for `GET /asset_platforms` request (no params) */
export type AssetPlatformsRequest = z.infer<typeof AssetPlatformsRequestSchema>;
