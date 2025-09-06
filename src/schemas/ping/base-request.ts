/**
 * @file src/schemas/ping/base-request.ts
 * @module schemas/ping/base-request
 * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {} from "../_shared/common.js";

/**
 * @endpoint GET /ping
 * @summary This endpoint allows you to check the API server status
 * @description
 * You can also go to status.coingecko.com to check the API server status and further maintenance notices.
 * @param NONE
 */
export const baseRequestSchema = z.object({}).strict();
