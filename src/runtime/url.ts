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
 * - formatPath(template, params): typed wrapper over core.formatPath (keeps PathParams typing)
 * - joinBaseAndPath(base, path): re-export from core
 * - toURL(base, path, params): runtime-aware URL builder using buildQuery
 * - qsString(path, params): canonical "a=1&b=2" using buildQuery
 *
 * Notes:
 * - Path params (e.g. {id}) must be dropped by the caller before serialization.
 * - Keys are serialized via `buildQuery`, which already normalizes booleans,
 *   numbers, arrays (CSV), and drops empties/defaults.
 */

import type { Endpoint } from "./endpoints.js";
import { buildQuery } from "./query.js";
// Import generic helpers from core
import { formatPath as coreFormatPath, joinBaseAndPath, type PathParams } from "../core/url.js";

/** Empty params type that doesn’t allow any keys */
// type EmptyParams = Record<never, never>;

export const DEFAULT_BASE = "https://api.coingecko.com/api/v3";

// /**
//  * Extract required path-params from a `{param}` template.
//  * Re-declared here to preserve type-level inference for runtime exports.
//  */
// export type PathParams<T extends string> = string extends T
//   ? Record<string, string>
//   : T extends `${string}{${infer P}}${infer R}`
//     ? { [K in P | keyof PathParams<R>]: string }
//     : EmptyParams;

/**
 * Typed wrapper over the core `formatPath`. Keeps our PathParams inference.
 */
export function formatPath<T extends string>(template: T, params: PathParams<T>): string {
  return coreFormatPath(template, params);
}

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

// Re-export joiner for convenience so consumers don’t import from two places
// export { joinBaseAndPath };
