/**
 * @file src/endpoints/status_updates/responses.ts
 * @module status_updates.responses
 *
 * Type aliases for Status Updates responses.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type { StatusUpdatesResponseSchema, StatusUpdateSchema } from "./schemas.js";

/** Type for a single status update row. */
export type StatusUpdate = z.infer<typeof StatusUpdateSchema>;

/** Type for the envelope returned by `/status_updates` and `/coins/{id}/status_updates`. */
export type StatusUpdatesResponse = z.infer<typeof StatusUpdatesResponseSchema>;
