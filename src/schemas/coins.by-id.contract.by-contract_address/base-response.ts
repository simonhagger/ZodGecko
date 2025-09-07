/**
 * @file src/schemas/coins.by-id.contract.by-contract_address/base-response.ts
 * @module schemas/coins.by-id.contract.by-contract_address/base-response
 * @summary Base Response.
 */

/** Schema building types */
import { buildCoinResponseShape } from "../_shared/coins.js";

/**
 * CoinGecko API response for /coins/{id}.contract/{contract_address} endpoint.
 * @description Uses a factory to build the schema due to the fact that the schema is used by another endpoint also.
 */
export const baseResponseSchema = buildCoinResponseShape();
