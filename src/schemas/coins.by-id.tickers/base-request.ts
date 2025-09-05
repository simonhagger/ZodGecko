/**
 * @file src/schemas/coins.by-id.tickers/base-request.ts
 * @module schemas/coins.by-id.tickers/base-request
  * @summary Base Request.
 */

/** Zod import */
import { z } from "zod";

/** Shared imports */
import {
  CoinId,
  CSList,
  DefaultFalseBoolean,
  DexPairFormat,
  ExchangeId,
  PositiveNumber,
  TickersOrder,
} from "../_shared/common.js";

/**
 * @endpoint GET /coins/{id}/tickers
 * @summary This endpoint allows you to query the coin tickers on both centralized exchange (CEX) and decentralized exchange (DEX) based on a particular coin ID
 * @description
 * - You may obtain the coin ID (API ID) via several ways:
 *   - reference respective coin page and find ‘API ID’;
 *   - refer to "/coins/list" endpoint;
 *   - refer to google sheets (on CoinGecko site).
 * - You may specify the exchange_ids if you want to retrieve tickers for specific exchange only.
 * - You may include values such as page to specify which page of responses you would like to show.
 * - You may also flag to include more data such as exchange logo and depth.
 * - Notes:
 *   - The tickers are paginated to 100 items.
 *   - When dex_pair_format=symbol, the DEX pair base and target are displayed in symbol format (e.g. WETH, USDC) instead of as contract addresses.
 *   - When order is sorted by volume, converted_volume will be used instead of volume.
 * @param id (required string) The ID of the coin to query
 * @param exchange_ids (optional string or comma-separated list of strings) see: "exchanges/list" endpoint
 * @param include_exchange_logo (optional boolean) default=false
 * @param page (optional integer)
 * @param order (optional string ["trust_score_desc","trust_score_asc","volume_desc","volume_asc"])
 * @param depth (optional boolean) default=false
 * @param dex_pair_format (optional string ["symbol","contract_address"]) default=contract_address
 */
export const baseRequestSchema = z
  .object({
    id: CoinId,
    exchange_ids: CSList(ExchangeId).optional(),
    include_exchange_logo: DefaultFalseBoolean,
    page: PositiveNumber.optional(),
    order: TickersOrder.default("trust_score_desc"),
    depth: DefaultFalseBoolean,
    dex_pair_format: DexPairFormat.default("contract_address"),
  })
  .strict();
