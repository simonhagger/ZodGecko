/**
 * @file src/endpoints/asset-platforms/schemas.ts
 * @module assetPlatforms.schemas
 *
 * Schemas for the Asset Platforms endpoint group.
 * Provides request/response validation for the `/asset_platforms` API.
 */

import { z } from "zod";

import { tolerantObject } from "../../index.js";

/**
 * **GET /asset_platforms**
 *
 * Returns a list of asset platforms (blockchains) supported by CoinGecko.
 * Each platform includes its unique identifier, chain ID, and display names.
 */
export const AssetPlatformsResponseSchema = z.array(
  tolerantObject({
    id: z.string(),
    chain_identifier: z.number().nullable().optional(),
    name: z.string(),
    shortname: z.string().nullable().optional(),
  }),
);

/** Type inference for Asset Platforms response */
export type AssetPlatformsResponse = z.infer<typeof AssetPlatformsResponseSchema>;

/**
 * Request schema for `/asset_platforms`.
 * Currently takes no query parameters.
 */
export const AssetPlatformsRequestSchema = z.object({}).strict();

/** Type inference for Asset Platforms request */
export type AssetPlatformsRequest = z.infer<typeof AssetPlatformsRequestSchema>;
