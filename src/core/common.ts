/**
 * @file src/core/common.ts
 * @module core/common
 *
 * CoinGecko-specific shared types, enums, and helpers (Zod v4).
 * - Uses primitives from `core/primitives`.
 * - Centralizes request fragments (Pagination, CSList, IncludeTokens, etc.),
 *   domain enums (MarketsOrder, PrecisionString, locales), and response fragments.
 */

import { z } from "zod";

import { NonEmptyString, UrlString, brand } from "./primitives.js";

/* ============================================================================
 * 1) Domain "brand" scalars (IDs, currency)
 *    These are small branded strings used widely across the API.
 * ========================================================================== */

export const CoinId = brand(NonEmptyString, "CoinId");
export const VsCurrency = brand(z.string().min(1), "VsCurrency");

/** Other IDs & path params (not branded unless useful in your codebase) */
export const AssetPlatformId = z.string().min(1);
export const ExchangeId = z.string().min(1);
export const MarketId = z.string().min(1);

/** Contract address (EVM heuristic); falls back to string for non-EVM chains */
export const ContractAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .or(z.string());

/** DEX pair formatting choice used by tickers endpoints */
export const DexPairFormat = z.enum(["contract_address", "symbol"]);

/* ============================================================================
 * 2) Lightweight helpers (DX)
 *    Keep these generic but placed here for convenience across CoinGecko endpoints.
 * ========================================================================== */

/**
 * CSList — Comma-Separated List helper.
 * Accepts `string | string[]` for DX and outputs a **stable** comma-string (sorted, deduped).
 * Use for wire params like: ids, names, symbols, vs_currencies, price_change_percentage, contract_addresses, etc.
 */
export const CSList = <T extends z.ZodTypeAny>(inner?: T): z.ZodType<string> =>
  z
    .union([z.string(), z.array((inner ?? z.string()) as z.ZodTypeAny).nonempty()])
    .transform((v) => {
      if (Array.isArray(v)) {
        return [...new Set(v.map(String))].sort().join(",");
      }
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(",");
    });

/** Tolerant object helper — allow unknown fields while validating known keys (Zod v4 replacement for .passthrough()) */
export const tolerantObject = <T extends z.ZodRawShape>(shape: T): z.ZodTypeAny =>
  z.object(shape).catchall(z.unknown());

/** RecordBy — typed Record where key schema MUST be string/number/symbol in Zod v4 */
export type ZodRecordKey = z.ZodString | z.ZodNumber | z.ZodSymbol;
export const RecordBy = <K extends ZodRecordKey, V extends z.ZodTypeAny>(
  k: K,
  v: V,
): z.ZodTypeAny => z.record(k, v);

/* ============================================================================
 * 3) Common request fragments
 * ========================================================================== */

// ** Page selector **/
export const PageOnly = z.object({
  page: z.number().int().positive().default(1),
});

/** Standard pagination block used by many list endpoints */
export const Pagination = z.object({
  per_page: z.number().int().positive().max(250).default(100),
  ...PageOnly.shape, // reuses PageOnly for consistency
});

/** Selector block used by /simple/* and /coins/markets */
export const IncludeTokens = z.enum(["top", "all"]).default("top");
export const IdsNamesSymbolsTokens = z.object({
  ids: CSList(z.string()).optional(),
  names: CSList(z.string()).optional(),
  symbols: CSList(z.string()).optional(),
  include_tokens: IncludeTokens,
});
export type IdsNamesSymbolsTokens = z.infer<typeof IdsNamesSymbolsTokens>;

/** Comma-list aliases for readability in request schemas */
export const VsCurrencyList = CSList(VsCurrency);
// export const CoinIdList = CSList(z.string());
// export const NamesList = CSList(z.string());
// export const SymbolsList = CSList(z.string());

/* ============================================================================
 * 4) Enums (locales, precision, ordering, windows, intervals)
 *    Keep these centralized to avoid scattering literal unions.
 * ========================================================================== */

/** Locale options used by markets */
export const MarketsLocale = z
  .enum([
    "ar",
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en",
    "es",
    "fi",
    "fr",
    "he",
    "hi",
    "hr",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
    "lt",
    "nl",
    "no",
    "pl",
    "pt",
    "ro",
    "ru",
    "sk",
    "sl",
    "sv",
    "th",
    "tr",
    "uk",
    "vi",
    "zh",
    "zh-tw",
  ])
  .default("en");

/** Precision string accepted by several endpoints (NOTE: values are strings, not numbers) */
export const PrecisionString = z
  .enum([
    "full",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
  ])
  .default("2");

/** Ordering for /coins/markets */
export const MarketsOrder = z
  .enum([
    "market_cap_desc",
    "market_cap_asc",
    "volume_desc",
    "volume_asc",
    // If you’re on the newer spec, uncomment the ID sorts below:
    // "id_asc","id_desc",
  ])
  .default("market_cap_desc");

/** Ordering for tickers */
export const TickersOrder = z
  .enum(["trust_score_desc", "trust_score_asc", "volume_desc", "volume_asc"])
  .default("trust_score_desc");

/** Ordering for derivatives exchanges */
export const DerivativesExchangesOrder = z
  .enum([
    "name_asc",
    "name_desc",
    "open_interest_btc_asc",
    "open_interest_btc_desc",
    "trade_volume_24h_btc_asc",
    "trade_volume_24h_btc_desc",
  ])
  .default("open_interest_btc_desc");

/** Price-change windows used in markets requests and elsewhere */
export const PriceChangeWindows = z
  .enum(["1h", "24h", "7d", "14d", "30d", "200d", "1y"])
  .default("24h");

/** OHLC window (days) and chart interval */
export const OhlcDays = z.enum(["1", "7", "14", "30", "90", "180", "365"]).default("30");
export const DailyInterval = z.enum(["daily"]);

/* ============================================================================
 * 5) Time & numeric helpers reused in responses
 * ========================================================================== */

/** Timestamps used in chart/series endpoints */
export const UnixMs = z.number().int().nonnegative(); // ms epoch (commonly used in arrays)
export const UnixSec = z.number().int().nonnegative(); // seconds epoch (used in /range params)

/** Quote maps like { usd: 123, eur: 456 } */
export const QuoteMap = z.record(z.string(), z.number());

/** Timeseries tuples */
export const TsPoint = z.tuple([UnixMs, z.number()]);
export const TsSeries = z.array(TsPoint);

/** OHLC tuple used by /ohlc */
export const OhlcTuple = z.tuple([UnixMs, z.number(), z.number(), z.number(), z.number()]);

/* ============================================================================
 * 6) Common response fragments
 * ========================================================================== */

/** Image URL bundle — tolerant because API sometimes adds sizes */
export const ImageUrls = z
  .object({
    thumb: UrlString.optional(),
    small: UrlString.optional(),
    large: UrlString.optional(),
  })
  .partial()
  .catchall(z.unknown());

/** Localization record: { "en": "...", "de": "...", ... } (values can sometimes be null) */
export const Localization = z.record(z.string(), z.union([z.string(), z.null()])).optional();

/** Market chart family (prices, market_caps, total_volumes) */
export const MarketChart = z
  .object({
    prices: TsSeries.optional(),
    market_caps: TsSeries.optional(),
    total_volumes: TsSeries.optional(),
  })
  .catchall(z.unknown());

/** Minimal market reference (shared in tickers) */
export const MarketRef = z
  .object({
    name: z.string().optional(),
    identifier: z.string().optional(),
    has_trading_incentive: z.boolean().optional(),
  })
  .catchall(z.unknown());

/** Ticker shapes shared by coin/exchange tickers */
export const Ticker = z
  .object({
    base: z.string().optional(),
    target: z.string().optional(),
    market: MarketRef.optional(),
  })
  .catchall(z.unknown());

export const TickersEnvelope = z
  .object({
    name: z.string().optional(),
    tickers: z.array(Ticker).optional(),
  })
  .catchall(z.unknown());

/* ============================================================================
 * 7) Headers & meta
 * ========================================================================== */

export const RateLimitHeaders = z
  .object({
    "x-cgpro-api-limit": z.string().optional(),
    "x-cgpro-api-remaining": z.string().optional(),
    "x-cgpro-api-reset": z.string().optional(),
  })
  .catchall(z.unknown());

// Define the TypeScript type for parsed headers
export type RateLimitHeadersType = z.infer<typeof RateLimitHeaders>;
