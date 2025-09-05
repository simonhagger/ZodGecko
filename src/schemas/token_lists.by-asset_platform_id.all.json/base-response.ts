/**
 * @file src/schemas/token_lists.by-asset_platform_id.all.json/base-response.ts
 * @module schemas/token_lists.by-asset_platform_id.all.json/base-response
  * @summary Base Response.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {
  ContractAddress,
  ISODateTime,
  NonEmptyString,
  NullishNumber,
  NullishString,
  UrlStringOrUndefined,
} from "../_shared/common.js";

/**
 * @description CoinGecko API response schema for the token_lists/{asset_platform_id}/all.json endpoint.
 */
export const baseResponseSchema = z.looseObject({
  name: NullishString,
  logoURI: UrlStringOrUndefined.nullish(),
  keywords: z.array(NonEmptyString).nullish(),
  timestamp: ISODateTime,
  tokens: z.array(
    z.looseObject({
      chainId: NullishNumber,
      symbol: NullishString,
      address: ContractAddress.nullish(),
      decimals: NullishNumber,
      logoURI: UrlStringOrUndefined.nullish(),
    }),
  ),
});
