/**
 * @file src/schemas/asset_platforms/base-request.ts
 * @module schemas/asset_platforms/base-request
  * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {} from "../_shared/structures.js";

/**
 * @endpoint GET /asset_platforms
 * @summary This endpoint allows you to query all the asset platforms on CoinGecko
 * @description Fetches a list of all asset platforms supported by CoinGecko. Each platform includes its unique identifier, chain ID, and display names. This endpoint has no Path or Request Parameters.
 * @param filter (optional string ["nft"])
 */
export const baseRequestSchema = z.object({
  filter: z.enum(["nft"]).optional(),
});
