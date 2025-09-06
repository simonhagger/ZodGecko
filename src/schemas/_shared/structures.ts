/**
 * @file src/schemas/_shared/structures.ts
 * @module schemas/_shared/structures
 *
 * CoinGecko-specific shared types, enums, and helpers (Zod v4).
 * - Uses atomic types from `schemas/_shared/atoms`.
 * - Uses common types from `schemas/_shared/common`.
 * - Produces end consumable Zod structures for use in schema definitions
 * @summary Structures.
 */

/** Zod Import */
import z from "zod";

/** Shared imports */
import { CoinId, CSList } from "./common.js";

//** REQUEST FRAGMENTS */

/** Empty request object for robustness */
export const EmptyRequest = z.object({}).strict();

/** VsCurrency: 1 or a comma separated list of more than one vs_currencies */
export const VsCurrency = CSList(CoinId);

//** RESPONSE FRAGMENTS */

/** Empty response object for robustness */
export const EmptyResponse = z.object({}).strict();
