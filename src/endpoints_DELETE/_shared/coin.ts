// src/endpoints/_shared/coin.ts
import { z } from "zod";

import {
  NonEmptyString,
  UrlString,
  ImageUrls,
  Localization,
  QuoteMap,
  tolerantObject,
} from "../../core/common.js";

/** Links block (tolerant). */
export const CoinLinks = tolerantObject({
  homepage: z.array(UrlString).optional(),
  blockchain_site: z.array(UrlString).optional(),
  official_forum_url: z.array(UrlString).optional(),
  chat_url: z.array(UrlString).optional(),
  announcement_url: z.array(UrlString).optional(),
  twitter_screen_name: z.string().optional(),
  facebook_username: z.string().optional(),
  telegram_channel_identifier: z.string().optional(),
  subreddit_url: UrlString.optional(),
  repos_url: tolerantObject({
    github: z.array(UrlString).optional(),
    bitbucket: z.array(UrlString).optional(),
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
  current_price: QuoteMap.optional(),
  ath: QuoteMap.optional(),
  atl: QuoteMap.optional(),
  market_cap: QuoteMap.optional(),
  total_volume: QuoteMap.optional(),
  high_24h: QuoteMap.optional(),
  low_24h: QuoteMap.optional(),
  price_change_24h: z.number().nullable().optional(),
  price_change_percentage_24h: z.number().nullable().optional(),
  price_change_percentage_7d: z.number().nullable().optional(),
  price_change_percentage_14d: z.number().nullable().optional(),
  price_change_percentage_30d: z.number().nullable().optional(),
  price_change_percentage_60d: z.number().nullable().optional(),
  price_change_percentage_200d: z.number().nullable().optional(),
  price_change_percentage_1y: z.number().nullable().optional(),
  market_cap_rank: z.number().nullable().optional(),
  fully_diluted_valuation: QuoteMap.optional(),
  circulating_supply: z.number().nullable().optional(),
  total_supply: z.number().nullable().optional(),
  max_supply: z.number().nullable().optional(),
  last_updated: z.string().optional(), // swap to ISODateTime if you widened it
});

/** Platform address map sometimes present on contract lookups. */
export const CoinPlatforms = z.record(z.string(), z.string());

/** Required identity anchors. */
export const CoinIdentity = tolerantObject({
  id: NonEmptyString,
  symbol: NonEmptyString,
  name: NonEmptyString,
});

/**
 * Build a tolerant coin response shape (without tickers by default).
 * Use in `/coins/{id}` and `/coins/{id}/contract/{contract_address}`.
 */
export function buildCoinResponseShape(opts?: { includeTickers?: boolean }): z.ZodTypeAny {
  const base = {
    // anchors
    id: NonEmptyString,
    symbol: NonEmptyString,
    name: NonEmptyString,

    // taxonomy / metadata
    asset_platform_id: z.string().nullable().optional(),
    platforms: CoinPlatforms.optional(),
    hashing_algorithm: z.string().nullable().optional(),
    categories: z.array(z.string()).optional(),
    public_notice: z.string().nullable().optional(),
    additional_notices: z.array(z.string()).optional(),
    localization: Localization.optional(),
    description: Localization.optional(),

    // media & links
    image: ImageUrls.optional(),
    links: CoinLinks.optional(),

    // origin & rankings
    country_origin: z.string().optional(),
    genesis_date: z.string().nullable().optional(), // or ISODateTime
    sentiment_votes_up_percentage: z.number().nullable().optional(),
    sentiment_votes_down_percentage: z.number().nullable().optional(),
    market_cap_rank: z.number().nullable().optional(),
    coingecko_rank: z.number().nullable().optional(),
    coingecko_score: z.number().nullable().optional(),
    developer_score: z.number().nullable().optional(),
    community_score: z.number().nullable().optional(),
    liquidity_score: z.number().nullable().optional(),
    public_interest_score: z.number().nullable().optional(),

    // computed/metrics
    market_data: CoinMarketData.optional(),
    community_data: CoinCommunityData.optional(),
    developer_data: CoinDeveloperData.optional(),
  } as const;

  if (opts?.includeTickers) {
    return tolerantObject({
      ...base,
      tickers: z.array(z.unknown()).optional(),
    });
  }
  return tolerantObject(base);
}
