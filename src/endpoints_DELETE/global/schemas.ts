/**
 * @file schemas.ts
 * @module endpoints/global/schemas
 *
 * Zod schemas and TypeScript types for the `/global` and `/global/decentralized_finance_defi` endpoints.
 */

import { z } from "zod";

import { tolerantObject } from "../../core/common.js";

export { GlobalRequestSchema, GlobalDefiRequestSchema } from "./requests.js";

/** GET /global */
export const GlobalResponseSchema = tolerantObject({
  data: tolerantObject({
    active_cryptocurrencies: z.number().optional(),
    upcoming_icos: z.number().optional(),
    ongoing_icos: z.number().optional(),
    ended_icos: z.number().optional(),
    markets: z.number().optional(),
    total_market_cap: z.record(z.string(), z.number()).optional(),
    total_volume: z.record(z.string(), z.number()).optional(),
    market_cap_percentage: z.record(z.string(), z.number()).optional(),
    market_cap_change_percentage_24h_usd: z.number().optional(),
    updated_at: z.number().optional(),
  }),
});

/** Type for `GET /global` response. */
export type GlobalResponse = z.infer<typeof GlobalResponseSchema>;

/** GET /global/decentralized_finance_defi */
export const GlobalDefiResponseSchema = tolerantObject({
  data: tolerantObject({
    defi_market_cap: z.string().optional(),
    eth_market_cap: z.string().optional(),
    defi_to_eth_ratio: z.string().optional(),
    trading_volume_24h: z.string().optional(),
    defi_dominance: z.string().optional(),
    top_coin_name: z.string().optional(),
    top_coin_defi_dominance: z.number().optional(),
  }),
});

/** Type for `GET /global/decentralized_finance_defi` response. */
export type GlobalDefiResponse = z.infer<typeof GlobalDefiResponseSchema>;
