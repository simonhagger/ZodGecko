/**
 * @file src/runtime/url.ts
 * @module runtime/url
 *
 * Runtime – URL helpers
 * ---------------------
 * Exposes small helpers that sit on top of `buildQuery`.
 *
 * - toURL(base, path, params): builds a fully-qualified URL string with normalized query.
 * - qsString(path, params): returns a stable "a=b&c=d" query string.
 *
 * Notes:
 * - Path params (e.g. {id}) must be dropped by the caller before serialization.
 * - Keys are serialized via `buildQuery`, which already normalizes booleans, numbers, arrays (CSV), and drops empties/defaults.
 */

import type { EndpointSet } from "../index.js";
import { buildQuery } from "./query.js";

/** Empty params type that doesn’t allow any keys */
type EmptyParams = Record<never, never>;

/**
 * Extract required path-params from a `{param}` template.
 */
export type PathParams<T extends string> = string extends T
  ? Record<string, string> // generic string → unknown set of params
  : T extends `${string}{${infer P}}${infer R}`
    ? { [K in P | keyof PathParams<R>]: string } // collect all {param} names
    : EmptyParams;

/**
 * Replace `{param}` segments with provided params and URL-encode values.
 */
export function formatPath<T extends string>(template: T, params: PathParams<T>): string {
  let out = template as string;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`{${k}}`, "g"), encodeURIComponent(String(v)));
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
export function toURL(base: string, path: string, params: Record<string, unknown>): string {
  const url = new URL(joinBaseAndPath(base, path));
  const qs = buildQuery(path as EndpointSet, params);
  const keys = Object.keys(qs).sort();

  for (const k of keys) {
    const v = qs[k];
    url.searchParams.append(k, v);
  }
  return url.toString();
}

/**
 * Convert normalized query into a canonical query string: "a=1&b=2".
 * Keys are alphabetically sorted to aid caching/logging determinism.
 */
export function qsString(path: string, params: Record<string, unknown>): string {
  const qs = buildQuery(path as EndpointSet, params);
  const keys = Object.keys(qs).sort();
  return keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(qs[k])}`).join("&");
}
