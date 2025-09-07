/**
 * @file src/schemas/asset_platforms/base-response.ts
 * @module schemas/asset_platforms/base-response
 * @summary Base Response.
 */

/** Zod import */
import { z } from "zod";

/** Schema building types */
import {
  AssetPlatformId,
  ImageUrls,
  NullishNumber,
  NullishString,
  tolerantObject,
} from "../_shared/common.js";

/**
 * CoinGecko API response for /asset_platforms endpoint.
 * Tolerant to extra fields; key metrics are optional/nullable per API behavior.
 */
export const baseResponseSchema = z
  .array(
    tolerantObject({
      id: AssetPlatformId,
      chain_identifier: NullishNumber,
      name: NullishString,
      shortname: NullishString,
      native_coin_id: NullishString,
      image: ImageUrls.partial().nullish(),
    }),
  )
  .nullable();
