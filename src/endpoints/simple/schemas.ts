/**
 * @file src/endpoints/simple/schemas.ts
 * @module simple.schemas
 *
 * Zod schemas for the Simple endpoint family.
 * Covers:
 *   - GET /simple/price
 *   - GET /simple/token_price/{id}
 *   - GET /simple/supported_vs_currencies
 */

import { z } from "zod";

import { CoinId, CSList, PrecisionString, VsCurrency, VsCurrencyList } from "../../index.js";

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /simple/price
 * @summary Returns the current price of any supported cryptocurrency in any supported fiat or crypto currency.
 */
export const SimplePriceRequestSchema = z
  .object({
    vs_currencies: VsCurrencyList,
    ids: CSList(CoinId).optional(),
    names: CSList(z.string()).optional(),
    symbols: CSList(z.string()).optional(),
    include_tokens: z.enum(["top", "all"]).optional(),
    include_market_cap: z.boolean().optional(),
    include_24hr_vol: z.boolean().optional(),
    include_24hr_change: z.boolean().optional(),
    include_last_updated_at: z.boolean().optional(),
    precision: PrecisionString.optional(),
  })
  .strict();

/**
 * @endpoint GET /simple/token_price/{id}
 * @summary Returns the price of tokens for a given platform by contract addresses.
 */
export const SimpleTokenPriceRequestSchema = z
  .object({
    id: CoinId,
    contract_addresses: CSList(z.string()),
    vs_currencies: VsCurrencyList,
    include_market_cap: z.boolean().optional(),
    include_24hr_vol: z.boolean().optional(),
    include_24hr_change: z.boolean().optional(),
    include_last_updated_at: z.boolean().optional(),
    precision: PrecisionString.optional(),
  })
  .strict();

/**
 * @endpoint GET /simple/supported_vs_currencies
 * @summary Returns a list of supported vs_currencies.
 */
export const SupportedVsCurrenciesRequestSchema = z.object({}).strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * @response GET /simple/price
 * Example: `{ "bitcoin": { "usd": 12345.6, "eur": 11111 }, ... }`
 */
export const SimplePriceResponseSchema = z.record(z.string(), z.record(z.string(), z.number()));

/**
 * @response GET /simple/token_price/{id}
 * Example: `{ "0x123...": { "usd": 1.23, "eth": 0.0005 }, ... }`
 */
export const SimpleTokenPriceResponseSchema = z.record(
  z.string(),
  z.record(z.string(), z.number()),
);

/**
 * @response GET /simple/supported_vs_currencies
 * Example: `[ "usd", "eur", "btc", ... ]`
 */
export const SupportedVsCurrenciesResponseSchema = z.array(VsCurrency);
