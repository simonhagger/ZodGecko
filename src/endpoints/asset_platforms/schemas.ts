/**
 * @file src/endpoints/asset-platforms/schemas.ts
 * @module assetPlatforms.schemas
 *
 * Schemas for the Asset Platforms endpoint group.
 * Provides request/response validation for the `/asset_platforms` API.
 */

import { z } from "zod";

import { NullableNumber, NullableString, tolerantObject } from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /asset_platforms
 * @summary This endpoint allows you to query all the asset platforms on CoinGecko
 * @description Fetches a list of all asset platforms supported by CoinGecko. Each platform includes its unique identifier, chain ID, and display names. This endpoint has no Path or Request Parameters.
 */
export const AssetPlatformsRequestSchema = z.object({}).strict();

/** Inferred type for Asset Platforms request */
export type AssetPlatformsRequest = z.infer<typeof AssetPlatformsRequestSchema>;

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * Asset Platforms response schema
 * Tolerant to extra fields; key metrics are optional/nullable per API behavior.
 */
export const AssetPlatformsResponseSchema = z.array(
  tolerantObject({
    id: z.string(),
    chain_identifier: NullableNumber.optional(),
    name: z.string(),
    shortname: NullableString.optional(),
  }),
);

/** Inferred type for Asset Platforms response */
export type AssetPlatformsResponse = z.infer<typeof AssetPlatformsResponseSchema>;
