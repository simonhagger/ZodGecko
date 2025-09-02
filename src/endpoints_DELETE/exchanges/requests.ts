/**
 * @file src/endpoints/exchanges/requests.ts
 * @module exchanges.requests
 *
 * Type aliases for request DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  ExchangesRequestSchema,
  ExchangesListRequestSchema,
  ExchangesByIdRequestSchema,
  ExchangesByIdTickersRequestSchema,
  ExchangesByIdVolumeChartRequestSchema,
} from "./schemas.js";

/** Type for `GET /exchanges` request. */
export type ExchangesRequest = z.infer<typeof ExchangesRequestSchema>;

/** Type for `GET /exchanges/list` request. */
export type ExchangesListRequest = z.infer<typeof ExchangesListRequestSchema>;

/** Type for `GET /exchanges/{id}` request. */
export type ExchangeByIdRequest = z.infer<typeof ExchangesByIdRequestSchema>;

/** Type for `GET /exchanges/{id}/tickers` request. */
export type ExchangeTickersRequest = z.infer<typeof ExchangesByIdTickersRequestSchema>;

/** Type for `GET /exchanges/{id}/volume_chart` request. */
export type ExchangeVolumeChartRequest = z.infer<typeof ExchangesByIdVolumeChartRequestSchema>;
