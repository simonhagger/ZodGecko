/**
 * @file src/schemas/coins.by-id.contract.by-contract_address/base-request.ts
 * @module schemas/coins.by-id.contract.by-contract_address/base-request
  * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import { CoinId, ContractAddress } from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}/contract/{contract_address}
 
 * @summary This endpoint allows you to query all the metadata (image, websites, socials, description, contract address, etc.) and market data (price, ATH, exchange tickers, etc.) of a coin from the CoinGecko coin page based on an asset platform and a particular token contract address
 * @description You may obtain the asset platform and contract address via several ways:
 * - refers to respective coin page and find ‘contract address’.
 * - refers to /coins/list endpoint (include platform = true).
 * - Coin descriptions may include newline characters represented as \r\n (escape sequences), which may require processing for proper formatting.
 * @param id (required string) The ID of the asset platform you wish to query, see: "/asset_platforms" endpoint.
 * @param contract_address (required string)
  */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    contract_address: ContractAddress,
  })
  .strict();
