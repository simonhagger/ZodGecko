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
  NullableString,
  VsQuote,
  VsQuoteString,
  IdsNamesSymbols,
  CoinName,
  CoinSymbol,
  ExchangeId,
  DefaultTrueBoolean,
  DefaultFalseBoolean,
  OneToThreeSixtyFiveString,
} from "../../index.js";

/** Nested Objects in the Coins endpoint group responses */

/** Links.repos_url subtype */
const ReposUrl = z
  .object({
    github: z.array(NullableString).optional(),
    bitbucket: z.array(NullableString).optional(),
  })
  .partial();

/** Links block */
const Links = z
  .object({
    homepage: z.array(NullableString).optional(),
    blockchain_site: z.array(NullableString).optional(),
    official_forum_url: z.array(NullableString).optional(),
    chat_url: z.array(NullableString).optional(),
    announcement_url: z.array(NullableString).optional(),
    twitter_screen_name: NullableString.optional(), // still present in payloads; followers deprecated
    facebook_username: NullableString.optional(),
    telegram_channel_identifier: NullableString.optional(),
    subreddit_url: NullableString.optional(),
    repos_url: ReposUrl.optional(),
  })
  .partial();

/** Platforms (simple map of chain -> address) */
const Platforms = z.record(z.string(), NullableString);

/** Detail platforms shape (richer than plain map on newer responses) */
const DetailPlatform = z
  .object({
    decimal_place: NullableNumber.optional(),
    contract_address: NullableString.optional(),
  })
  .partial();

/** Detail platforms map */
const DetailPlatforms = z.record(z.string(), DetailPlatform);

/** Community data block */
const CommunityData = z
  .object({
    facebook_likes: NullableNumber.optional(),
    twitter_followers: NullableNumber.optional(),
    // twitter_followers: NullableNumber, // deprecated per docs (May 15, 2025)
    telegram_channel_user_count: NullableNumber.optional(),
    reddit_average_posts_48h: NullableNumber.optional(),
    reddit_average_comments_48h: NullableNumber.optional(),
    reddit_subscribers: NullableNumber.optional(),
    reddit_accounts_active_48h: z.union([z.number(), NullableString]).nullable().optional(), // historically stringified
  })
  .partial();

/** Developer data block */
const DeveloperData = z
  .object({
    forks: NullableNumber.optional(),
    stars: NullableNumber.optional(),
    subscribers: NullableNumber.optional(),
    total_issues: NullableNumber.optional(),
    closed_issues: NullableNumber.optional(),
    pull_requests_merged: NullableNumber.optional(),
    pull_request_contributors: NullableNumber.optional(),
    code_additions_deletions_4_weeks: z
      .object({
        additions: NullableNumber.optional(),
        deletions: NullableNumber.optional(),
      })
      .partial()
      .optional(),
    commit_count_4_weeks: NullableNumber.optional(),
    // sometimes present in extended payloads:
    last_4_weeks_commit_activity_series: z.array(z.number()).optional(),
  })
  .partial();

/** Public interest block */
const PublicInterestStats = z
  .object({
    alexa_rank: NullableNumber.optional(),
    bing_matches: NullableNumber.optional(),
  })
  .partial();

/** Sparkline (7d) */
const Sparkline = z
  .object({
    price: z.array(z.number()).optional(),
  })
  .partial();

/** Market object (within tickers) */
const TickerMarket = z
  .object({
    name: NonEmptyString.optional(),
    identifier: NullableString.optional(),
    has_trading_incentive: z.boolean().nullable().optional(),
  })
  .partial();

/** Ticker object */
const Ticker = z
  .object({
    base: NonEmptyString.optional(),
    target: NonEmptyString.optional(),
    market: TickerMarket.optional(),
    last: NullableNumber.optional(),
    volume: NullableNumber.optional(),
    converted_last: VsQuote.optional(), // { btc, eth, usd } (example)
    converted_volume: VsQuote.optional(),
    trust_score: z.enum(["green", "yellow", "red"]).nullable().optional(),
    bid_ask_spread_percentage: NullableNumber.optional(),
    timestamp: ISODateTime.nullable().optional(),
    last_traded_at: ISODateTime.nullable().optional(),
    last_fetch_at: ISODateTime.nullable().optional(),
    is_anomaly: z.boolean().nullable().optional(),
    is_stale: z.boolean().nullable().optional(),
    trade_url: NullableString.optional(),
    token_info_url: NullableString.optional(),
    coin_id: NullableString.optional(),
    target_coin_id: NullableString.optional(), // appears for some DEX pairs
    // CEX/DEX specific extras that sometimes appear
    base_coin_id: NullableString.optional(),
    target_coin_id_full: NullableString.optional(),
  })
  .partial();

/** ROI sub-block (historic field for some coins) */
const ROI = z
  .object({
    times: NullableNumber.optional(),
    currency: NullableString.optional(),
    percentage: NullableNumber.optional(),
  })
  .partial();

/**
 * Detailed coin info.
 * - `market_data.*` quotes reuse `QuoteMap` (e.g., { usd: 123 | null }).
 * - `localization` accepts null values in some locales.
 */
const MarketDataQuoteSchema = VsQuote;

/** Big, detailed market_data block */
const MarketData = z
  .object({
    current_price: MarketDataQuoteSchema.optional(), // Record<vs, number|null>
    total_value_locked: z.union([VsQuote, VsQuoteString]).optional(), // docs show TVL by vs currency
    mcap_to_tvl_ratio: NullableNumber.optional(),
    fdv_to_tvl_ratio: NullableNumber.optional(),

    roi: ROI.optional(),

    ath: MarketDataQuoteSchema.optional(),
    ath_change_percentage: MarketDataQuoteSchema.optional(),
    ath_date: z.record(z.string(), ISODateTime.nullable()).optional(),

    atl: MarketDataQuoteSchema.optional(),
    atl_change_percentage: MarketDataQuoteSchema.optional(),
    atl_date: z.record(z.string(), ISODateTime.nullable()).optional(),

    market_cap: MarketDataQuoteSchema.optional(),
    fully_diluted_valuation: MarketDataQuoteSchema.optional(),
    total_volume: MarketDataQuoteSchema.optional(),

    high_24h: MarketDataQuoteSchema.optional(),
    low_24h: MarketDataQuoteSchema.optional(),

    price_change_24h: NullableNumber.optional(),
    price_change_percentage_24h: NullableNumber.optional(),
    price_change_percentage_7d: NullableNumber.optional(),
    price_change_percentage_14d: NullableNumber.optional(),
    price_change_percentage_30d: NullableNumber.optional(),
    price_change_percentage_60d: NullableNumber.optional(),
    price_change_percentage_200d: NullableNumber.optional(),
    price_change_percentage_1y: NullableNumber.optional(),

    market_cap_change_24h: NullableNumber.optional(),
    market_cap_change_percentage_24h: NullableNumber.optional(),

    price_change_24h_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_1h_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_24h_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_7d_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_14d_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_30d_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_60d_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_200d_in_currency: MarketDataQuoteSchema.optional(),
    price_change_percentage_1y_in_currency: MarketDataQuoteSchema.optional(),
    market_cap_change_24h_in_currency: MarketDataQuoteSchema.optional(),

    total_supply: NullableNumber.optional(),
    max_supply: NullableNumber.optional(),
    circulating_supply: NullableNumber.optional(),

    last_updated: ISODateTime.optional(),
    sparkline_7d: Sparkline.optional(),
  })
  .partial();

/** Status update item (rarely needed, but present when `status_updates=true`) */
const StatusUpdate = z
  .object({
    description: NullableString.optional(),
    category: NullableString.optional(),
    created_at: ISODateTime.nullable().optional(),
    project: z
      .object({
        type: NullableString.optional(),
        id: NullableString.optional(),
        name: NullableString.optional(),
        image: NullableString.optional(),
      })
      .partial()
      .optional(),
    user: NullableString.optional(),
    user_title: NullableString.optional(),
    pin: z.boolean().nullable().optional(),
  })
  .partial();

/** Keep fragment but brand `ids`, `names`, and `symbols` */
const BrandedIdsNamesSymbolsAsCSV = IdsNamesSymbols.extend({
  ids: CSList(CoinId).optional(),
  names: CSList(CoinName).optional(),
  symbols: CSList(CoinSymbol).optional(),
});

/* ============================================================================
 * Requests
 * ========================================================================== */

/**
 * @endpoint GET /coins/list
 * @summary This endpoint allows you to query all the supported coins on CoinGecko with coins ID, name and symbol
 * @description Fetches a list of all coins supported by CoinGecko. Each coin includes its unique identifier, symbol, and name.
 * @params
 *   - include_platform (boolean) default=false
 */
export const CoinsListRequestSchema = z
  .object({ include_platform: z.boolean().default(false) })
  .strict();

/**
 * @endpoint GET /coins/markets
 * @summary This endpoint allows you to query all the supported coins with price, market cap, volume and market related data
 * @description Fetches market data (price, market cap, volume) for multiple coins listed on CoinGecko. You can filter results by currency, coin IDs, categories, and other parameters. Results are paginated and can be sorted by various metrics.
 * @params
 *   - vs_currency (required string)
 *   - ids|names|symbols (CSV via CSList) see: /coins/list
 *   - include_tokens (optional string ["top|all"]) default="top"
 *   - category (optional string) see: /coins/categories/list
 *   - order (optional string ["market_cap_asc","market_cap_desc","volume_asc","volume_desc","id_asc","id_desc"]) default="market_cap_desc"
 *   - per_page (optional integer [1..250]) default=100
 *   - page (optional integer) default=1
 *   - sparkline (optional boolean) default=false
 *   - price_change_percentage (optional string) ["1h","24h","7d","14d","30d","60d","200d","1y"] default="24h"
 *   - locale (optional string) ["ar","bg","cs","da","de","el","en","es","fi","fr","he","hi","hr","hu","id","it","ja","ko","lt","nl","no","pl","pt","ro","ru","sk","sl","sv","th","tr","uk","vi","zh","zh-tw"] default="en"
 *   - precision (optional string) ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"] NOTE: default is empty for auto precision
 */
export const CoinsMarketsRequestSchema = z
  .object({
    vs_currency: VsCurrency,
    ...BrandedIdsNamesSymbolsAsCSV.shape,
    include_tokens: IncludeTokens, // No optional marking as there is a defined default
    category: NullableString.optional(),
    order: MarketsOrder, // No optional marking as there is a defined default
    ...Pagination.shape, // No optional marking as there is a defined default
    sparkline: Sparkline, // No optional marking as there is a defined default
    price_change_percentage: CSList(PriceChangeWindows).optional(),
    locale: MarketsLocale, // No optional marking as there is a defined default
    precision: PrecisionString.optional(),
  })
  .strict();

/**
 * @endpoint GET /coins/{id}
 * @summary This endpoint allows you to query all the metadata (image, websites, socials, description, contract address, etc.) and market data (price, ATH, exchange tickers, etc.) of a coin from the CoinGecko coin page based on a particular coin ID
 * @description Fetches comprehensive information about a specific coin, including its market data, community statistics, developer activity, and public interest metrics. Various boolean flags allow you to include or exclude specific sections of data in the response.
 * @params
 *  - localization (optional boolean) default=true
 *  - tickers (optional boolean) default=true
 *  - market_data (optional boolean) default=true
 *  - community_data (optional boolean) default=true
 *  - developer_data (optional boolean) default=true
 *  - sparkline (optional boolean) default=false
 *  - dex_pair_format (optional string ["contract_address", "symbol"])
 */
export const CoinsByIdRequestSchema = z
  .object({
    id: CoinId,
    localization: DefaultTrueBoolean,
    tickers: DefaultTrueBoolean,
    market_data: DefaultTrueBoolean,
    community_data: DefaultTrueBoolean,
    developer_data: DefaultTrueBoolean,
    sparkline: Sparkline,
    dex_pair_format: DexPairFormat,
  })
  .strict();

/**
 * @endpoint GET /coins/{id}/tickers
 * @summary This endpoint allows you to query the coin tickers on both centralized exchange (CEX) and decentralized exchange (DEX) based on a particular coin ID
 * @description Fetches ticker information for a specific coin, including data from both centralized exchanges (CEX) and decentralized exchanges (DEX). You can filter results by exchange IDs, include exchange logos, and control pagination and sorting of the returned tickers. Additional options allow you to include depth data and specify the format for DEX pairings.
 * @params
 *  - exchange_ids (optional string | CSList<ExchangeId>) see: /exchanges/list
 *  - include_exchange_logo (optional boolean) default=false
 *  - page (optional integer) default=1
 *  - order (optional string ["trust_score_desc", "trust_score_asc", "volume_desc", "volume_asc"]) default="trust_score_desc"
 *  - depth (optional boolean) default=false
 *  - dex_pair_format (optional string ["contract_address", "symbol"]) default="contract_address"
 */
export const CoinsByIdTickersRequestSchema = z
  .object({
    id: CoinId,
    exchange_ids: CSList(ExchangeId).optional(),
    include_exchange_logo: DefaultFalseBoolean,
    ...PageOnly.shape, // No optional marking as there is a defined default
    order: TickersOrder, // No optional marking as there is a defined default
    depth: DefaultFalseBoolean,
    dex_pair_format: DexPairFormat, // No optional marking as there is a defined default
  })
  .strict();

/**
 * @endpoint GET /coins/{id}/history
 * @summary This endpoint allows you to query the historical data (price, market cap, 24hrs volume, ...) at a given date for a coin based on a particular coin ID
 * @description Get historical data (name, price, market, stats) at a given date for a coin
 * @params
 *   - date (required string) format: "dd-mm-yyyy"
 *   - localization (optional boolean) default=true
 */
export const CoinsByIdHistoryRequestSchema = z
  .object({ id: CoinId, date: DdMmYyyy, localization: DefaultTrueBoolean })
  .strict();

/**
 * @endpoint GET /coins/{id}/market_chart
 * @summary This endpoint allows you to get the historical chart data of a coin including time in UNIX, price, market cap and 24hr volume based on particular coin ID
 * @description Get historical market data include price, market cap, and 24h volume within a range of days.
 * @params
 *   - vs_currency (required string) see: /simple/supported_vs_currencies
 *   - days (required string) NOTE: limited to ["1".."365"] inclusive on free endpoints
 *   - interval (optional string ["daily"]) NOTE: default is empty for auto granularity
 *   - precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const CoinsByIdMarketChartRequestSchema = z
  .object({
    id: CoinId,
    vs_currency: VsCurrency,
    days: OneToThreeSixtyFiveString,
    interval: DailyInterval.optional(),
    precision: PrecisionString.optional(),
  })
  .strict();

/**
 * @endpoint GET /coins/{id}/market_chart/range
 * @summary This endpoint allows you to get the historical chart data of a coin within certain time range in UNIX along with price, market cap and 24hr volume based on particular coin ID.
 * @description Get historical market data include price, market cap, and 24h volume within a range of days.
 * @params
 *   - vs_currency (required string) see: /simple/supported_vs_currencies
 *   - from (required integer) NOTE: starting date as a Unix Timestamp
 *   - to (required integer) NOTE: ending date as a Unix Timestamp
 *   - precision (optional string ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","full"]) NOTE: default is empty for auto precision
 */
export const CoinsByIdMarketChartRangeRequestSchema = z
  .object({
    id: CoinId,
    vs_currency: VsCurrency,
    from: UnixSec,
    to: UnixSec,
    precision: PrecisionString.optional(),
  })
  .strict();

/**
 * @endpoint GET /coins/{id}/ohlc
 * @summary This endpoint allows you to get the OHLC chart (Open, High, Low, Close) of a coin based on particular coin ID
 * @description Get Open High Low Close (OHLC) data for a given coin.
 * @params
 *   - vs_currency (required string) see: /simple/supported_vs_currencies
 *   - days (required string ["1","7","14","30","90","180","365"])
 */
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
  current_price: NullableNumber,
  market_cap: NullableNumber.optional(),
  market_cap_rank: NullableNumber.optional(),
  total_volume: NullableNumber.optional(),
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
  platforms: z.record(z.string(), NullableString).optional(),
});

/** Array of /coins/list rows. */
export const CoinsListResponseSchema = z.array(CoinsListItemSchema);

/**
 * CoinGecko API response for /coins/{id}
 */
export const CoinsByIdResponseSchema = tolerantObject({
  // Identity
  id: NonEmptyString,
  symbol: NonEmptyString,
  name: NonEmptyString,

  // Top-level metadata
  asset_platform_id: NullableString.optional(),
  platforms: Platforms.optional(),
  detail_platforms: DetailPlatforms.optional(),
  hashing_algorithm: NullableString.optional(),
  categories: z.array(NullableString.optional()).optional(),
  preview_listing: z.boolean().nullable().optional(),
  public_notice: NullableString.optional(),
  additional_notices: z.array(NullableString.optional()).optional(),

  // i18n and content
  localization: Localization, // all langs; 'en' commonly used
  description: z.record(z.string(), NullableString).optional(), // all langs; 'en' commonly used
  links: Links.partial().optional(),
  image: ImageUrls.partial().optional(),

  // Origin & lifecycle
  country_origin: NullableString.optional(),
  genesis_date: NullableString.optional(), // ISO date (YYYY-MM-DD) or null
  contract_address: NullableString.optional(), // sometimes shown on top-level for tokens
  block_time_in_minutes: NullableNumber.optional(),

  // Sentiment & rankings
  sentiment_votes_up_percentage: NullableNumber.optional(),
  sentiment_votes_down_percentage: NullableNumber.optional(),
  market_cap_rank: NullableNumber.optional(),
  coingecko_rank: NullableNumber.optional(),
  coingecko_score: NullableNumber.optional(),
  developer_score: NullableNumber.optional(),
  community_score: NullableNumber.optional(),
  liquidity_score: NullableNumber.optional(),
  public_interest_score: NullableNumber.optional(),

  // Watchlist & TVL extras (documented in “Common use cases”)
  watchlist_portfolio_users: NullableNumber.optional(), // number of users with this coin in watchlist
  market_data: MarketData.optional(),

  // Optional sections behind flags
  community_data: CommunityData.partial().optional(),
  developer_data: DeveloperData.partial().optional(),
  public_interest_stats: PublicInterestStats.partial().optional(),
  status_updates: z.array(StatusUpdate.partial().optional()).optional(),

  // Tickers (limited to 100 per call)
  tickers: z.array(Ticker.partial().optional()).optional(),

  // Book-keeping
  last_updated: ISODateTime.optional(),
});

/** Historical snapshot for a given date. */
export const CoinsByIdHistoryResponseSchema = tolerantObject({
  id: NonEmptyString.optional(),
  symbol: NonEmptyString.optional(),
  name: NonEmptyString.optional(),
  image: ImageUrls.partial().optional(),
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
