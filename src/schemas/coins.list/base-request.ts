/**
 * @file src/schemas/coins.list/base-request.ts
 * @module schemas/coins.list/base
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { DefaultFalseBoolean } from "../_shared/common.js";

/**
 * @endpoint GET /coins/list
 * @summary This endpoint allows you to query all the supported coins on CoinGecko with coins ID, name and symbol
 * @description
 * - You may use this endpoint to query the list of coins with coin ID for other endpoints that contain params like id or ids (coin ID).
 * - Notes:
 *   - There is no pagination required for this endpoint.
 *   - Access to inactive coins via the Public API is restricted.
 * @param include_platform (optional boolean)
 */
export const baseRequestSchema = z
  .object({
    include_platform: DefaultFalseBoolean,
  })
  .strict();
