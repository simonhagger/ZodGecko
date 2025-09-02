/**
 * @file src/endpoints/asset-platforms/index.ts
 * @module assetPlatforms
 *
 * Public surface for the Asset Platforms endpoint group.
 * - Types are re-exported from requests/responses.
 * - Runtime Zod schemas are exposed under `assetPlatforms.schemas`.
 */

export * as schemas from "./schemas.js";
export * as requests from "./requests.js";
export * as responses from "./responses.js";
