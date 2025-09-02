// src/endpoints/_shared/coin.ts
import { z } from "zod";

import { ISODateTime, NullableNumber, NullableString } from "./atoms.js";
import {
  NonEmptyString,
  UrlStringOrUndefined,
  ImageUrls,
  Localization,
  QuoteMap,
  tolerantObject,
} from "./common.js";

/** Links block (tolerant). */
export const CoinLinks = tolerantObject({
  homepage: z.array(UrlStringOrUndefined).optional(),
  blockchain_site: z.array(UrlStringOrUndefined).optional(),
  official_forum_url: z.array(UrlStringOrUndefined).optional(),
  chat_url: z.array(UrlStringOrUndefined).optional(),
  announcement_url: z.array(UrlStringOrUndefined).optional(),
  twitter_screen_name: z.string().optional(),
  facebook_username: z.string().optional(),
  telegram_channel_identifier: z.string().optional(),
  subreddit_url: UrlStringOrUndefined.optional(),
  repos_url: tolerantObject({
    github: z.array(UrlStringOrUndefined).optional(),
    bitbucket: z.array(UrlStringOrUndefined).optional(),
  }).optional(),
});

/** Community metrics (tolerant). */
export const CoinCommunityData = tolerantObject({
  facebook_likes: z.number().nullable().optional(),
  twitter_followers: z.number().nullable().optional(), // may be deprecated upstream
  reddit_average_posts_48h: z.number().nullable().optional(),
  reddit_average_comments_48h: z.number().nullable().optional(),
  reddit_subscribers: z.number().nullable().optional(),
  reddit_accounts_active_48h: z.number().nullable().optional(),
});

/** Developer metrics (tolerant). */
export const CoinDeveloperData = tolerantObject({
  forks: z.number().nullable().optional(),
  stars: z.number().nullable().optional(),
  subscribers: z.number().nullable().optional(),
  total_issues: z.number().nullable().optional(),
  closed_issues: z.number().nullable().optional(),
  pull_requests_merged: z.number().nullable().optional(),
  pull_request_contributors: z.number().nullable().optional(),
  commit_count_4_weeks: z.number().nullable().optional(),
  code_additions_deletions_4_weeks: tolerantObject({
    additions: z.number().nullable().optional(),
    deletions: z.number().nullable().optional(),
  }).optional(),
});

/** Market data (tolerant common subset). */
export const CoinMarketData = tolerantObject({
  current_price: QuoteMap.nullable().optional(),
  ath: QuoteMap.nullable().optional(),
  atl: QuoteMap.nullable().optional(),
  market_cap: QuoteMap.nullable().optional(),
  total_volume: QuoteMap.nullable().optional(),
  high_24h: QuoteMap.nullable().optional(),
  low_24h: QuoteMap.nullable().optional(),
  price_change_24h: z.number().nullable().optional(),
  price_change_percentage_24h: z.number().nullable().optional(),
  price_change_percentage_7d: z.number().nullable().optional(),
  price_change_percentage_14d: z.number().nullable().optional(),
  price_change_percentage_30d: z.number().nullable().optional(),
  price_change_percentage_60d: z.number().nullable().optional(),
  price_change_percentage_200d: z.number().nullable().optional(),
  price_change_percentage_1y: z.number().nullable().optional(),
  market_cap_rank: z.number().nullable().optional(),
  fully_diluted_valuation: QuoteMap.nullable().optional(),
  circulating_supply: z.number().nullable().optional(),
  total_supply: z.number().nullable().optional(),
  max_supply: z.number().nullable().optional(),
  last_updated: z.string().nullable().optional(), // swap to ISODateTime if you widened it
});

/** Platform address map sometimes present on contract lookups. */
export const CoinPlatforms = z.record(z.string(), z.string().nullable());

/** Required identity anchors. */
export const CoinIdentity = tolerantObject({
  id: NonEmptyString,
  symbol: NullableString.optional(),
  name: NullableString.optional(),
});

/**
 * Build a tolerant coin response shape (without tickers by default).
 * Use in `/coins/{id}` and `/coins/{id}/contract/{contract_address}`.
 */
export function buildCoinResponseShape(opts?: { includeTickers?: boolean }): z.ZodTypeAny {
  const base = {
    // anchor
    id: NonEmptyString,

    // taxonomy / metadata
    symbol: NullableString.optional(),
    name: NullableString.optional(),
    asset_platform_id: NullableString.optional(),
    platforms: CoinPlatforms.nullable().optional(),
    hashing_algorithm: NullableString.optional(),
    categories: z.array(z.string()).nullable().optional(),
    public_notice: NullableString.optional(),
    additional_notices: z.array(z.string()).nullable().optional(),
    localization: Localization.nullable().optional(),
    description: Localization.nullable().optional(),

    // media & links
    image: ImageUrls.partial().nullable().optional(),
    links: CoinLinks.nullable().optional(),

    // origin & rankings
    country_origin: NullableString.optional(),
    genesis_date: z.string().or(ISODateTime).nullable().optional(),
    sentiment_votes_up_percentage: NullableNumber.optional(),
    sentiment_votes_down_percentage: NullableNumber.optional(),
    market_cap_rank: NullableNumber.optional(),
    coingecko_rank: NullableNumber.optional(),
    coingecko_score: NullableNumber.optional(),
    developer_score: NullableNumber.optional(),
    community_score: NullableNumber.optional(),
    liquidity_score: NullableNumber.optional(),
    public_interest_score: NullableNumber.optional(),

    // computed/metrics
    market_data: CoinMarketData.nullable().optional(),
    community_data: CoinCommunityData.nullable().optional(),
    developer_data: CoinDeveloperData.nullable().optional(),
  } as const;

  if (opts?.includeTickers) {
    return tolerantObject({
      ...base,
      tickers: z.array(z.unknown()).optional(),
    });
  }
  return tolerantObject(base);
}
