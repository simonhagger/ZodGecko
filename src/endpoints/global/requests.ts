/**
 * @file requests.ts
 * @module endpoints/global/requests
 *
 * Request schemas for `/global` and `/global/decentralized_finance_defi`.
 * Both endpoints take no parameters.
 */

import { z } from "zod";

/** GET /global */
export const GlobalRequestSchema = z.object({}).strict();

/** Type for `GET /global` request. */
export type GlobalRequest = z.infer<typeof GlobalRequestSchema>;

/** GET /global/decentralized_finance_defi */
export const GlobalDefiRequestSchema = z.object({}).strict();

/** Type for `GET /global/decentralized_finance_defi` request. */
export type GlobalDefiRequest = z.infer<typeof GlobalDefiRequestSchema>;
