/**
 * @file src/endpoints/ping/schemas.ts
 * @module ping.schemas
 *
 * Zod schemas for the Ping endpoint.
 * Covers:
 *   - GET /ping
 *
 * Notes
 * - Endpoint is used to test API connectivity.
 * - Always returns a gecko_says field.
 */

import { z } from "zod";

/* ============================================================================
 * Request
 * ========================================================================== */

/**
 * @endpoint GET /ping
 * @summary No request params; always an empty object.
 */
export const PingRequestSchema = z.object({}).strict();

/* ============================================================================
 * Response
 * ========================================================================== */

/**
 * @endpoint GET /ping
 * @summary Returns a gecko_says string.
 * Example: { "gecko_says": "(V3) To the Moon!" }
 */
export const PingResponseSchema = z
  .object({
    gecko_says: z.string(),
  })
  .catchall(z.unknown());

/* ============================================================================
 * Example
 * ========================================================================== *
 * @example
 * import { ping } from "ZodGecko/endpoints";
 *
 * // Request schema: no params
 * const req = ping.schemas.PingRequestSchema.parse({});
 *
 * const res = await fetch("https://api.coingecko.com/api/v3/ping");
 * const data = ping.schemas.PingResponseSchema.parse(await res.json());
 */
