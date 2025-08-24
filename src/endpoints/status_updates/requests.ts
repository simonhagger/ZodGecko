/**
 * @file src/endpoints/status_updates/requests.ts
 * @module status_updates.requests
 *
 * Type aliases for Status Updates requests.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { StatusUpdatesRequestSchema, CoinStatusUpdatesRequestSchema } from "./schemas.js";

/** Type for `GET /status_updates` request. */
export type StatusUpdatesRequest = z.infer<typeof StatusUpdatesRequestSchema>;

/** Type for `GET /coins/{id}/status_updates` request. */
export type CoinStatusUpdatesRequest = z.infer<typeof CoinStatusUpdatesRequestSchema>;
