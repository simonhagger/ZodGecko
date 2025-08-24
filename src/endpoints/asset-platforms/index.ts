/**
 * @file src/endpoints/asset-platforms/index.ts
 * @module assetPlatforms
 *
 * Public surface for the Asset Platforms endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `assetPlatforms.schemas`.
 */

export type { AssetPlatformsRequest } from "./requests.js";
export type { AssetPlatformsResponse } from "./responses.js";
export * as schemas from "./schemas.js";
