/**
 * @file src/endpoints/exchanges/responses.ts
 * @module exchanges.responses
 *
 * Type aliases for response DTOs.
 * Runtime schemas live in `./schemas`.
 */

import type { z } from "zod";

import type {
  ExchangesResponseSchema,
  ExchangesListResponseSchema,
  ExchangesByIdTickersResponseSchema,
  ExchangesByIdVolumeChartResponseSchema,
  ExchangeRowSchema,
  ExchangesListItemSchema,
} from "./schemas.js";

/** Row type for an exchange. */
export type ExchangeRow = z.infer<typeof ExchangeRowSchema>;

/** Type for `GET /exchanges` response. */
export type ExchangesResponse = z.infer<typeof ExchangesResponseSchema>;

/** Item type for minimal exchange list. */
export type ExchangesListItem = z.infer<typeof ExchangesListItemSchema>;

/** Type for `GET /exchanges/list` response. */
export type ExchangesListResponse = z.infer<typeof ExchangesListResponseSchema>;

/** Type for `GET /exchanges/{id}` response. */
export type ExchangeByIdResponse = z.infer<typeof ExchangeRowSchema>;

/** Type for `GET /exchanges/{id}/tickers` response. */
export type ExchangeTickersResponse = z.infer<typeof ExchangesByIdTickersResponseSchema>;

/** Type for `GET /exchanges/{id}/volume_chart` response. */
export type ExchangeVolumeChartResponse = z.infer<typeof ExchangesByIdVolumeChartResponseSchema>;
