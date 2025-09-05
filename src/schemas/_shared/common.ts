/**
 * @file src/schemas/_shared/common.ts
 * @module schemas/_shared/common
 *
 * CoinGecko-specific shared types, enums, and helpers (Zod v4).
 * - Uses atomic types from `schemas/_shared/atoms`.
 * - Centralizes request fragments (Pagination, CSList, IncludeTokens, etc.),
 *   domain enums (MarketsOrder, PrecisionString, locales), and response fragments.
  * @summary Common.
 */

import { z } from "zod";

import { NonEmptyString, PositiveNumber, UrlStringOrUndefined } from "./atoms.js";

/* ============================================================================
 * Re-Exports
 * ========================================================================== */

/** Re-export atomic building blocks so shared modules don’t need to import from atoms directly */
export {
  // Number Related
  NumberLike,
  NullableNumber,
  NullishNumber,
  PositiveNumber,
  CoercedStringToNumber,
  // String Related
  StringLike,
  NullableString,
  NullishString,
  NonEmptyString,
  CoercedNumberToString,
  // URL Related
  UrlStringOrUndefined,
  // Date Related
  ISODateTime,
  DdMmYyyy,
  // Boolean Related
  BooleanLike,
  DefaultTrueBoolean,
  DefaultFalseBoolean,
  OptionalBoolean,
  NullishBoolean,
} from "./atoms.js";

/** Quote formats for returns */

/** Vs Quote (number) that may be null */
export const VsQuote = z.record(z.string(), z.number().nullable());

/** Vs Quote (string) that may be null */
export const VsQuoteString = z.record(z.string(), z.string().nullable());

// /** Create a nominal (branded) type on top of a Zod schema. */
// export type Brand<T, B extends string> = T & { readonly __brand: B };

// /** Create a branded type on top of a Zod schema. Identify a string by it's brand */
// export const brand = <T, B extends string>(
//   schema: z.ZodType<T>,
//   _brand: B,
// ): z.ZodType<Brand<T, B>> => schema as z.ZodType<Brand<T, B>>;

/* ============================================================================
 * 1) Domain "brand" scalars (IDs, currency)
 *    These are small branded strings used widely across the API.
 * ========================================================================== */

/** Branded string for strong typing of Coin IDs */
export const CoinId = NonEmptyString.brand<"CoinId">();
/** Branded string for strong typing of Coin Names */
export const CoinName = NonEmptyString.brand<"CoinName">();
/** Branded string for strong typing of Coin Symbols */
export const CoinSymbol = NonEmptyString.brand<"CoinSymbol">();
/** Branded string for strong typing of the "vs_currency" parameter. */
export const VsCurrency = NonEmptyString.brand<"VsCurrency">();
/** Branded string for strong typing of the "asset_platform_id" parameter. */
export const AssetPlatformId = NonEmptyString.brand<"AssetPlatformId">();
/** Branded string for strong typing of the "exchange_id" parameter. */
export const ExchangeId = NonEmptyString.brand<"ExchangeId">();
/** Branded string for strong typing of the "market_id" parameter. */
export const MarketId = NonEmptyString.brand<"MarketId">();

/** Branded array of CoinIds. */
export const CoinIds = CoinId.array();
/** Branded array of CoinNames. */
export const CoinNames = CoinName.array();
/** Branded array of CoinSymbols. */
export const CoinSymbols = CoinSymbol.array();

/** Branded CoinId or CoinId Array */
export const CoinIdOrCoinIds = z.union([CoinId, CoinIds]);
/** Branded CoinName or CoinName Array */
export const CoinNameOrCoinNames = z.union([CoinName, CoinNames]);
/** Branded CoinSymbol or CoinSymbol Array */
export const CoinSymbolOrCoinSymbols = z.union([CoinSymbol, CoinSymbols]);

/** Contract address (EVM heuristic); falls back to non-empty string for non-EVM chains */
export const ContractAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .or(NonEmptyString);

/** "1".."365", digits only, no leading/trailing spaces (trimmed) expressed as a string */
export const OneToThreeSixtyFiveString = z
  .string()
  .trim()
  .refine((s) => /^(?:[1-9]\d{0,2})$/.test(s), {
    message: "Must be an integer string (no signs, no decimals, no leading zeros).",
  })
  .refine(
    (s) => {
      const n = Number(s);
      return n >= 1 && n <= 365;
    },
    { message: "Must be between 1 and 365." },
  );

/* ============================================================================
 * 2) Lightweight helpers (DX)
 *    Keep these generic but placed here for convenience across CoinGecko endpoints.
 * ========================================================================== */

/**
 * CSList — Comma-Separated List helper.
 * Normalizes string | array inputs to a stable CSV:
 *  - trim items
 *  - drop empties
 *  - (optional) validate each token with `inner`
 *  - dedupe + sort
 *  - error if effectively empty after normalization
 */
export const CSList = <T extends z.ZodTypeAny>(inner?: T): z.ZodType<string> => {
  // Accept string or array; coerce to array of strings
  const ToArray = z
    .union([z.string(), z.array(z.any()).nonempty()])
    .transform((v) => (Array.isArray(v) ? v.map(String) : String(v).split(",")));

  const CleanAndValidate = ToArray.transform((arr) =>
    arr.map((s) => s.trim()).filter((s) => s.length > 0),
  ).superRefine((tokens, ctx) => {
    // Reject effectively-empty CSV
    if (tokens.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "CSV must not be empty",
      });
    }
    // Validate each token if `inner` provided
    if (inner) {
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const r = (inner as z.ZodTypeAny).safeParse(t);
        if (!r.success) {
          ctx.addIssue({
            code: "custom",
            path: [i],
            message: `Invalid CSV member: ${t}`,
          });
        }
      }
    }
  });

  return CleanAndValidate.transform((tokens) => Array.from(new Set(tokens)).sort().join(","));
};

/** Tolerant object helper — allow unknown fields while validating known keys (Zod v4 replacement for .passthrough()) */
export const tolerantObject = <T extends z.ZodRawShape>(shape: T): z.ZodTypeAny =>
  z.object(shape).catchall(z.unknown());

/** ZodRecordKey — typed Record where key schema MUST be string/number/symbol in Zod v4 */
export type ZodRecordKey = z.ZodString | z.ZodNumber | z.ZodSymbol;
/** RecordBy — typed Record where key schema is a ZodRecordKey and value schema is a ZodTypeAny in Zod v4 */
export const RecordBy = <K extends ZodRecordKey, V extends z.ZodTypeAny>(
  k: K,
  v: V,
): z.ZodTypeAny => z.record(k, v);

/* ============================================================================
 * 3) Common request fragments
 * ========================================================================== */

/** Page selector - Zod object that represents a positive whole number */
export const PageOnly = PositiveNumber;

/** PerPage selector - Zod object that represents a positive whole number up to 250 */
export const PerPageOnly = z.number().int().positive().max(250);

/** Standard pagination block used by many list endpoints */
export const Pagination = z.object({
  per_page: PerPageOnly,
  page: PageOnly,
});

/** Selector block used by /simple/* and /coins/markets */
export const IncludeTokens = z.enum(["top", "all"]);

/**
 * Selector block for coin IDs, names, and symbols.
 */

/** Branded `ids`, `names`, and `symbols` as CSV */
export const BrandedIdsNamesSymbols = z
  .object({
    ids: CSList(CoinIdOrCoinIds),
    names: CSList(CoinNameOrCoinNames),
    symbols: CSList(CoinSymbolOrCoinSymbols),
  })
  .partial();
/**
 * Inferred type for Branded version of coin IDs, names, and symbols.
 */
export type BrandedIdsNamesSymbols = z.infer<typeof BrandedIdsNamesSymbols>;

/** Comma-list aliases for readability in request schemas */
export const VsCurrencyList = CSList(VsCurrency);

/* ============================================================================
 * 4) Enums (locales, precision, ordering, windows, intervals)
 *    Keep these centralized to avoid scattering literal unions.
 * ========================================================================== */

/** Locale options used by markets */
export const MarketsLocale = z.enum([
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
]);

/** Precision string accepted by several endpoints (NOTE: values are strings, not numbers) */
export const PrecisionString = z.enum([
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
]);

/** Ordering for /coins/markets */
export const MarketsOrder = z.enum([
  "market_cap_desc",
  "market_cap_asc",
  "volume_desc",
  "volume_asc",
  "id_asc",
  "id_desc",
]);

/** Ordering for tickers */
export const TickersOrder = z.enum([
  "trust_score_desc",
  "trust_score_asc",
  "volume_desc",
  "volume_asc",
]);

/** Ordering for derivatives exchanges */
export const DerivativesExchangesOrder = z.enum([
  "name_asc",
  "name_desc",
  "open_interest_btc_asc",
  "open_interest_btc_desc",
  "trade_volume_24h_btc_asc",
  "trade_volume_24h_btc_desc",
]);

/** Price-change windows used in markets requests and elsewhere */
export const PriceChangeWindows = z.enum(["1h", "24h", "7d", "14d", "30d", "200d", "1y"]);

/** OHLC window options (days) string of numerical equivalents */
export const OhlcDays = z.enum(["1", "7", "14", "30", "90", "180", "365"]);

/** OHLC window (days) and chart interval literally only a single string option */
export const DailyInterval = z.enum(["daily"]);

/** DEX pair formatting choice used by tickers endpoints */
export const DexPairFormat = z.enum(["contract_address", "symbol"]);

/* ============================================================================
 * 5) Time & numeric helpers reused in responses
 * ========================================================================== */

/** Unix Milliseconds Timestamp used in chart/series endpoints */
export const UnixMs = z.number().int().nonnegative(); // ms epoch (commonly used in arrays)

/** Unix Seconds Timestamp used in chart/series endpoints */
export const UnixSec = z.number().int().nonnegative(); // seconds epoch (used in /range params)

/** Quote maps like { usd: 123, eur: 456 | null } */
export const QuoteMap = z.record(z.string(), z.number().nullable());

/** Timeseries tuples { [1735689600, 123] } */
export const TsPoint = z.tuple([UnixMs, z.number()]);

/** Timeseries array of tuples */
export const TsSeries = z.array(TsPoint);

/** OHLC tuple used by /ohlc { [1735689600, 123, 123, 123, 123] } */
export const OhlcTuple = z.tuple([UnixMs, z.number(), z.number(), z.number(), z.number()]);

/** OHLC series used by /ohlc an array of OhlcTuples */
export const OhlcSeries = z.array(OhlcTuple);

/* ============================================================================
 * 6) Common response fragments
 * ========================================================================== */

/** Image URL bundle — tolerant because API sometimes adds sizes */
export const ImageUrls = z
  .object({
    thumb: UrlStringOrUndefined.nullish(),
    small: UrlStringOrUndefined.nullish(),
    large: UrlStringOrUndefined.nullish(),
  })
  .partial()
  .catchall(z.unknown());

/** Localization record: { "en": "...", "de": "...", ... } (values can sometimes be null) */
export const Localization = z.record(z.string(), z.string().nullable());

//** Platforms entry record: { "ethereum": "0x1234...", "polygon-pos": "0x1234..." } */
export const PlatformsEntry = z.record(z.string(), ContractAddress.nullish());

/** Market chart family (prices, market_caps, total_volumes) */
export const MarketChart = z
  .object({
    prices: TsSeries.nullish(),
    market_caps: TsSeries.nullish(),
    total_volumes: TsSeries.nullish(),
  })
  .partial()
  .catchall(z.unknown());

/** Minimal market reference (shared in tickers) */
export const MarketRef = z
  .object({
    name: z.string().nullable(),
    identifier: z.string().nullable(),
    has_trading_incentive: z.boolean().nullable(),
  })
  .partial()
  .catchall(z.unknown());

/** Ticker shapes shared by coin/exchange tickers */
export const Ticker = z
  .object({
    base: z.string().nullable(),
    target: z.string().nullable(),
    market: MarketRef.nullable(),
  })
  .partial()
  .catchall(z.unknown());

/** Tickers envelope used in coin/exchange tickers */
export const TickersEnvelope = z
  .object({
    name: z.string().nullable(),
    tickers: z.array(Ticker).nullable(),
  })
  .partial()
  .catchall(z.unknown());

/* ============================================================================
 * 7) Headers & meta
 * ========================================================================== */

/** Rate-limit headers returned by CoinGecko API PRO endpoints */
export const RateLimitHeaders = z
  .object({
    "x-cgpro-api-limit": z.string().optional(),
    "x-cgpro-api-remaining": z.string().optional(),
    "x-cgpro-api-reset": z.string().optional(),
  })
  .catchall(z.unknown());

/**  Define the TypeScript type for parsed headers */
export type RateLimitHeadersType = z.infer<typeof RateLimitHeaders>;
