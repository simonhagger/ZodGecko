/**
 * @file src/fetch/rate-limit.ts
 * @module fetch/rate-limit
 * @summary Rate Limit.
 */
// src/fetch/rate-limit.ts
import { RateLimitHeaders } from "../schemas/_shared/common.js";
import type { RateLimitHeadersType } from "../schemas/_shared/common.js";
import type { HeadersLike } from "../types.js";

/** Structural check for a Headers-like object (no DOM types needed). */
function isHeadersLike(x: unknown): x is HeadersLike {
  return Boolean(x) && typeof (x as { get?: unknown }).get === "function";
}

/** Safe coercion to string (no object-to-[object Object] surprises). */
function coerceHeaderValue(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

/**
 * Read a header by name. For plain objects, match case-insensitively.
 * @param h (required: object | HeadersLike)
 * @param name (required: string)
 * @returns string | null
 */
export function getHeader(h: HeadersLike | Record<string, unknown>, name: string): string | null {
  if (isHeadersLike(h)) {
    const v = h.get(name);
    return v === null ? null : v;
  }

  const rec = h; // already narrowed to Record<string, unknown>

  // exact match first
  const v1 = coerceHeaderValue(rec[name]);
  if (v1 !== null) return v1;

  // then case-insensitive scan
  const lower = name.toLowerCase();
  for (const k of Object.keys(rec)) {
    if (k.toLowerCase() === lower) {
      return coerceHeaderValue(rec[k]) ?? null;
    }
  }
  return null;
}

/**
 * Parse CoinGecko rate-limit headers with Zod (tolerant to unknowns).
 * @param h (required: object | HeadersLike)
 * @returns object
 */
export function parseRateLimitHeaders(
  h: HeadersLike | Record<string, unknown>,
): RateLimitHeadersType {
  const keys = ["x-cgpro-api-limit", "x-cgpro-api-remaining", "x-cgpro-api-reset"] as const;

  const picked: Record<string, unknown> = {};
  for (const k of keys) {
    const v = getHeader(h, k);
    if (v !== null) picked[k] = v;
  }
  return RateLimitHeaders.parse(picked);
}

/**
 * Type alias RateLimitNumbers.
 * @property limit (optional: number).
 * @property remaining (optional: number).
 * @property reset (optional: number).
 */
export type RateLimitNumbers = Readonly<{
  limit?: number;
  remaining?: number;
  reset?: number;
}>;

/**
 * Numeric convenience view (keeps `undefined` when absent).
 * @param h (required: object | HeadersLike)
 * @returns object
 */
export function parseRateLimitNumbers(h: HeadersLike | Record<string, unknown>): RateLimitNumbers {
  const rl = parseRateLimitHeaders(h);
  const num = (s: string | undefined): number | undefined =>
    s !== undefined ? Number(s) : undefined;
  return {
    limit: num(rl["x-cgpro-api-limit"]),
    remaining: num(rl["x-cgpro-api-remaining"]),
    reset: num(rl["x-cgpro-api-reset"]),
  };
}
