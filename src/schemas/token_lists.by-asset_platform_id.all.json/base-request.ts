/**
 * @file src/schemas/token_lists.by-asset_platform_id.all.json/base-request.ts
 * @module schemas/token_lists.by-asset_platform_id.all.json/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { AssetPlatformId } from "../_shared/common.js";

/**
 * @endpoint GET token_lists/{asset_platform_id}/all.json
 * @summary This endpoint allows you to get full list of tokens of a blockchain network (asset platform) that is supported by Ethereum token list standard
 * @description
 * - A token will only be included in the list if the contract address is added by CoinGecko team.
 * @params asset_platform_id (required string) see: "/asset_platforms"
 */
export const baseRequestSchema = z
  .object({
    id: AssetPlatformId,
  })
  .strict();
