/**
 * @file src/runtime/url.ts
 * @module runtime/url
 *
 * Runtime – URL helpers
 * ---------------------
 * Thin wrappers over core/url plus runtime-specific helpers that depend
 * on Endpoint + buildQuery.
 *
 * Exposed:
 * - formatPath(template, params): re-export from core (type-safe)
 * - joinBaseAndPath(base, path): re-export from core
 * - toURL(base, path, params): runtime-aware URL builder using buildQuery
 * - qsString(path, params): canonical "a=1&b=2" using buildQuery
 *
 * Notes:
 * - Path params (e.g. {id}) must be dropped by the caller before serialization.
 * - Keys are serialized via `buildQuery`, which normalizes values and drops empties/defaults.
 */

import type { Endpoint } from "./endpoints.js";
import { buildQuery } from "./query.js";
// Import only what's used
import { joinBaseAndPath } from "../core/url.js";

/** Default base URL for CoinGecko API v3 */
export const DEFAULT_BASE = "https://api.coingecko.com/api/v3";

/**
 * Build a full URL with normalized/stable query serialization.
 * - Delegates joining to `core.joinBaseAndPath`.
 * - Uses runtime `buildQuery` (Endpoint-aware: default-dropping, CSV, booleans).
 */
export function toURL(base: string, path: string, params: Record<string, unknown>): string {
  const href = joinBaseAndPath(base, path);
  const url = new URL(href);
  const qs = buildQuery(path as Endpoint, params);

  for (const k of Object.keys(qs).sort()) {
    url.searchParams.append(k, qs[k]);
  }
  return url.toString();
}

/**
 * Convert normalized query into a canonical query string: "a=1&b=2".
 * Keys are alphabetically sorted to aid caching/logging determinism.
 */
export function qsString(path: string, params: Record<string, unknown>): string {
  const qs = buildQuery(path as Endpoint, params);
  const keys = Object.keys(qs).sort();
  return keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(qs[k])}`).join("&");
}

// Re-exports so consumers don’t import from two places
export { joinBaseAndPath } from "../core/url.js";
export { formatPath } from "../core/url.js";
