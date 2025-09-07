/**
 * @file src/schemas/simple.supported_vs_currencies/base-request.ts
 * @module schemas/simple.supported_vs_currencies/base-request
 * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {} from "../_shared/common.js";

/**
 * @endpoint GET /simple/supported_vs_currencies
 * @summary This endpoint allows you to query all the supported currencies on CoinGecko
 * @description
 * - You may use this endpoint to query the list of currencies for other endpoints that contain params like "vs_currencies".
 * @param NONE
 */
export const baseRequestSchema = z.object({}).strict();
