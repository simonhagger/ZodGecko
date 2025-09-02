/**
 * @file src/endpoints/ping/responses.ts
 * @module ping.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { PingResponseSchema } from "./schemas.js";

/** Type for `GET /ping` response. */
export type PingResponse = z.infer<typeof PingResponseSchema>;
