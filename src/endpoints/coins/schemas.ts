/**
 * @file src/endpoints/coins/schemas.ts
 * @module coins.schemas
 *
 * Zod schemas for the Coins endpoint group.
 * Covers:
 *   - GET /coins/markets
 *   - GET /coins/list
 *   - GET /coins/{id}
 *   - GET /coins/{id}/tickers
 *   - GET /coins/{id}/history
 *   - GET /coins/{id}/market_chart
 *   - GET /coins/{id}/market_chart/range
 *   - GET /coins/{id}/ohlc
 *
 * Notes
 * - Request fragments use shared defaults from `common.ts`. Do NOT wrap those with `.optional()`,
 *   otherwise defaults won’t apply and the serializer can’t drop server-defaulted params.
 * - `buildQuery()` drops documented server defaults (see `server-defaults.ts`) and alphabetizes keys.
 * - CSV params use `CSList` which sorts & dedupes values for deterministic caching.
 * - Responses are tolerant to absorb upstream additions safely.
 *
 * Testing
 * - Put tests in: `src/endpoints/coins/__tests__/`
 *   - requests.test.ts → parse + buildQuery roundtrip, defaults drop
 *   - responses.test.ts → parse fixtures (tolerant behavior)
 */

import { z } from "zod";

import {
  CoinId,
  IdsNamesSymbolsTokens,
  VsCurrency,
  MarketsOrder,
  MarketsLocale,
  PrecisionString,
  PriceChangeWindows,
  CSList,
  Pagination,
  IncludeTokens,
  DailyInterval,
  OhlcDays,
  DexPairFormat,
  TickersOrder,
  PageOnly,
  tolerantObject,
  ImageUrls,
  QuoteMap,
  MarketChart,
  Localization,
  TickersEnvelope,
  OhlcTuple,
  ISODateTime,
  NonEmptyString,
  DdMmYyyy,
  NullableNumber,
  UrlString,
  UnixSec,
} from "../../index.js";

// keep fragment but brand `ids`
const IdsNamesSymbolsTokensFragment = IdsNamesSymbolsTokens.extend({
  ids: CSList(CoinId).optional(),
});

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /coins/markets
 * @summary Market rows for multiple coins
 * @params
 *   - vs_currency (required)
 *   - ids|names|symbols (CSV via CSList)
 *   - include_tokens (top|all; default in common.ts)
 *   - per_page=100, page=1 (server defaults)
 *   - order=market_cap_desc, locale=en, precision=2 (server defaults)
 *   - price_change_percentage (CSV windows via CSList)
 */
export const CoinsMarketsRequestSchema = z
  .object({
    vs_currency: VsCurrency,
    ...IdsNamesSymbolsTokensFragment.shape,
    include_tokens: IncludeTokens,
    ...Pagination.shape,
    sparkline: z.boolean().optional(),
    price_change_percentage: CSList(PriceChangeWindows).optional(),
    locale: MarketsLocale,
    precision: PrecisionString,
    order: MarketsOrder,
  })
  .strict();

/** @endpoint GET /coins/list */
export const CoinsListRequestSchema = z
  .object({ include_platform: z.boolean().optional() })
  .strict();

/**
 * @endpoint GET /coins/{id}
 * @summary Detailed coin info (flags control sections)
 * @params localization, tickers, market_data, community_data, developer_data, sparkline, dex_pair_format
 */
export const CoinsByIdRequestSchema = z
  .object({
    id: CoinId,
    localization: z.boolean().optional(),
    tickers: z.boolean().optional(),
    market_data: z.boolean().optional(),
    community_data: z.boolean().optional(),
    developer_data: z.boolean().optional(),
    sparkline: z.boolean().optional(),
    dex_pair_format: DexPairFormat.optional(),
  })
  .strict();

/** @endpoint GET /coins/{id}/history */
export const CoinsByIdHistoryRequestSchema = z
  .object({ id: CoinId, date: DdMmYyyy, localization: z.boolean().optional() })
  .strict();

/**
 * @endpoint GET /coins/{id}/tickers
 * @params exchange_ids (CSV), include_exchange_logo, page, order, depth, dex_pair_format
 */
export const CoinsByIdTickersRequestSchema = z
  .object({
    id: CoinId,
    exchange_ids: CSList(z.string()).optional(),
    include_exchange_logo: z.boolean().optional(),
    ...PageOnly.shape,
    order: TickersOrder.optional(),
    depth: z.boolean().optional(),
    dex_pair_format: DexPairFormat.optional(),
  })
  .strict();

/** @endpoint GET /coins/{id}/market_chart */
export const CoinsByIdMarketChartRequestSchema = z
  .object({
    id: CoinId,
    vs_currency: VsCurrency,
    days: z.union([z.string(), z.number()]),
    interval: DailyInterval.optional(),
    precision: PrecisionString,
  })
  .strict();

/** @endpoint GET /coins/{id}/market_chart/range */
export const CoinsByIdMarketChartRangeRequestSchema = z
  .object({
    id: CoinId,
    vs_currency: VsCurrency,
    from: UnixSec,
    to: UnixSec,
    precision: PrecisionString,
  })
  .strict();

/** @endpoint GET /coins/{id}/ohlc */
export const CoinsByIdOhlcRequestSchema = z
  .object({ id: CoinId, vs_currency: VsCurrency, days: OhlcDays })
  .strict();

/* ============================================================================
 * Responses
 * ========================================================================== */

/**
 * Market row for /coins/markets.
 * Tolerant to extra fields; key metrics are optional/nullable per API behavior.
 */
export const CoinsMarketsRowSchema = tolerantObject({
  id: NonEmptyString,
  symbol: NonEmptyString,
  name: NonEmptyString,
  image: UrlString.optional(),
  current_price: z.number().nullable(),
  market_cap: z.number().nullable(),
  market_cap_rank: z.number().nullable().optional(),
  total_volume: z.number().nullable().optional(),
  price_change_percentage_24h: NullableNumber,
  last_updated: ISODateTime.optional(),
});

/** Array of market rows. */
export const CoinsMarketsResponseSchema = z.array(CoinsMarketsRowSchema);

/** /coins/list row (tolerant for extra fields like platforms map). */
export const CoinsListItemSchema = tolerantObject({
  id: NonEmptyString,
  symbol: NonEmptyString,
  name: NonEmptyString,
  platforms: z.record(z.string(), z.string()).optional(),
});

/** Array of /coins/list rows. */
export const CoinsListResponseSchema = z.array(CoinsListItemSchema);

/**
 * Detailed coin info.
 * - `market_data.*` quotes reuse `QuoteMap` (e.g., { usd: 123 }).
 * - `localization` accepts null values in some locales.
 */
const MarketDataQuoteSchema = QuoteMap;

export const CoinsByIdResponseSchema = tolerantObject({
  id: NonEmptyString,
  symbol: NonEmptyString,
  name: NonEmptyString,
  localization: Localization,
  description: z.object({ en: z.string().optional() }).partial().optional(),
  image: ImageUrls.optional(),
  market_data: z
    .object({
      current_price: MarketDataQuoteSchema.optional(),
      market_cap: MarketDataQuoteSchema.optional(),
      total_volume: MarketDataQuoteSchema.optional(),
      price_change_percentage_24h: z.number().nullable().optional(),
      last_updated: ISODateTime.optional(),
    })
    .partial()
    .optional(),
  last_updated: ISODateTime.optional(),
});

/** Historical snapshot for a given date. */
export const CoinsByIdHistoryResponseSchema = tolerantObject({
  id: NonEmptyString.optional(),
  symbol: NonEmptyString.optional(),
  name: NonEmptyString.optional(),
  image: ImageUrls.optional(),
  market_data: z
    .object({
      current_price: MarketDataQuoteSchema.optional(),
      market_cap: MarketDataQuoteSchema.optional(),
      total_volume: MarketDataQuoteSchema.optional(),
    })
    .partial()
    .optional(),
  localization: Localization,
});

/** Tickers envelope for /coins/{id}/tickers. */
export const CoinsByIdTickersResponseSchema = TickersEnvelope;

/** Market chart (prices, market_caps, total_volumes). */
export const CoinsByIdMarketChartResponseSchema = MarketChart;

/** Market chart (range variant). */
export const CoinsByIdMarketChartRangeResponseSchema = MarketChart;

/** OHLC array for /coins/{id}/ohlc. */
export const CoinsByIdOhlcResponseSchema = z.array(OhlcTuple);

/* ============================================================================
 * Examples
 * ========================================================================== *
 * @example
 * import { coins } from "ZodGecko/endpoints";
 * import { buildQuery } from "ZodGecko";
 *
 * const req = coins.schemas.MarketsRequestSchema.parse({
 *   vs_currency: "usd",
 *   ids: ["bitcoin", "ethereum"],
 * });
 * const qs = buildQuery("/coins/markets", req);
 * // -> { ids: "bitcoin,ethereum", vs_currency: "usd" }
 *
 * const res = await fetch(`${baseUrl}/coins/markets?${new URLSearchParams(qs)}`);
 * const data = coins.schemas.MarketsResponseSchema.parse(await res.json());
 */
