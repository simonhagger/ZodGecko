/**
 * @file src/endpoints/ping/requests.ts
 * @module ping.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { PingRequestSchema } from "./schemas.js";

/** Type for `GET /ping` request (always empty object). */
export type PingRequest = z.infer<typeof PingRequestSchema>;
