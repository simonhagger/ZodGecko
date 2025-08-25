/**
 * @file src/runtime/url.ts
 * @module runtime/url
 *
 * Runtime – URL helpers
 * ---------------------
 * Small helpers that sit on top of `buildQuery`.
 *
 * - formatPath(template, pathParams): replace `{param}` segments and URL-encode.
 * - joinBaseAndPath(base, path): join with exactly one slash.
 * - toURL(base, path, query): build a fully-qualified URL with normalized query.
 * - qsString(path, query): stable "a=b&c=d" query string (sorted keys).
 * - pathParamKeys(template): extract `{param}` names from a template.
 * - dropPathParamsByTemplate(template, obj): clone and remove `{param}` keys.
 *
 * Notes:
 * - Keys/values are normalized via `buildQuery`, which handles booleans, numbers,
 *   arrays (CSV, dedup/sort), trims empties, and drops documented server defaults.
 */
import { URL } from "node:url";

import type { Endpoint } from "./endpoints.js";
import { buildQuery } from "./query.js";

/** Optional base you can re-use with `toURL` if you like */
export const DEFAULT_BASE = "https://api.coingecko.com/api/v3";

/** Empty params type that doesn’t allow any keys. */
type EmptyParams = Record<never, never>;

/**
 * Extract required path-params from a `{param}` template (type-level).
 */
export type PathParams<T extends string> = string extends T
  ? Record<string, string>
  : T extends `${string}{${infer P}}${infer R}`
    ? { [K in P | keyof PathParams<R>]: string }
    : EmptyParams;

/**
 * Extract `{param}` keys from a template like "/coins/{id}/tickers" (runtime).
 */
export function pathParamKeys(template: string): string[] {
  const keys: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) keys.push(m[1]);
  return keys;
}

/**
 * Drop `{param}` keys from an object (non-mutating) based on a template.
 * Useful when callers pass a single object that includes both path and query keys.
 */
export function dropPathParamsByTemplate<T extends Record<string, unknown>>(
  template: string,
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj };
  for (const k of pathParamKeys(template)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete out[k];
  }
  return out;
}

/**
 * Replace `{param}` segments with provided params and URL-encode values.
 */
export function formatPath<T extends string>(template: T, params: PathParams<T>): string {
  let out = template as string;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), encodeURIComponent(String(v)));
  }
  return out;
}

/**
 * Join `base` + `path` with exactly one slash.
 * - Removes trailing slashes from base
 * - Removes leading slashes from path
 * - Handles empty base or empty path
 */
export function joinBaseAndPath(base: string, path: string): string {
  if (!base) return path.replace(/^\/+/, "");
  if (!path) return base.replace(/\/+$/, "");
  const baseTrim = base.replace(/\/+$/, "");
  const pathTrim = path.replace(/^\/+/, "");
  return `${baseTrim}/${pathTrim}`;
}

/**
 * Build a full URL with normalized/stable query serialization.
 */
export function toURL<E extends Endpoint>(
  base: string,
  path: E,
  params: Record<string, unknown>,
): string {
  const url = new URL(joinBaseAndPath(base, path));
  const qs = buildQuery(path, params);
  const keys = Object.keys(qs).sort();
  for (const k of keys) {
    url.searchParams.append(k, qs[k]);
  }
  return url.toString();
}

/**
 * Convert normalized query into a canonical query string: "a=1&b=2".
 * Keys are alphabetically sorted to aid caching/logging determinism.
 */
export function qsString<E extends Endpoint>(path: E, params: Record<string, unknown>): string {
  const qs = buildQuery(path, params);
  const keys = Object.keys(qs).sort();
  return keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(qs[k])}`).join("&");
}
