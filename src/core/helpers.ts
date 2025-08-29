/**
 * @file src/core/helpers.ts
 * @module core/helpers
 *
 * Generic Zod helpers used across the library.
 * - `QueryValue`, `QueryObject`: flexible schemas for query string objects.
 * - `Infer<T>`: convenience alias for `z.infer<T>`.
 */

import { z } from "zod";

/** Union of common query string value types (string, number, boolean, string[], or undefined). */
export const QueryValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.undefined(),
]);

/** Query object schema: arbitrary string keys with {@link QueryValue} values. */
export const QueryObject = z.record(z.string(), QueryValue);

/** Convenience alias: infer the TypeScript type of a Zod schema. */
export type Infer<T extends z.ZodTypeAny> = z.infer<T>;

/**
 * Remove a set of keys from an object (non-mutating).
 * Shallow-clones `obj`, then deletes the specified keys on the clone.
 */
export function dropParams<T extends Record<string, unknown>, K extends readonly (keyof T)[]>(
  obj: T,
  keys: K,
): Omit<T, K[number]> {
  const result = { ...obj };
  for (const k of keys) {
    delete (result as Record<string, unknown>)[k as string];
  }
  return result;
}

/** Convenience wrapper for the very common `{ id }` path param. */
export function dropId<T extends Record<string, unknown> & { id?: unknown }>(
  obj: T,
): Omit<T, "id"> {
  return dropParams(obj, ["id"] as const);
}

/**
 * Pick a subset of keys from an object (non-mutating).
 * Symmetric counterpart to {@link dropParams}.
 */
export function pick<T extends Record<string, unknown>, const K extends readonly (keyof T)[]>(
  obj: T,
  keys: K,
): Pick<T, K[number]> {
  // Typed via fromEntries; no unsafe mutation.
  const entries = keys.filter((k) => k in obj).map((k) => [k, obj[k]] as const);
  return Object.fromEntries(entries) as Pick<T, K[number]>;
}

/**
 * Remove properties whose value is `undefined` (non-mutating).
 * Useful before serializing to JSON or composing query objects.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Normalize a value to an array. `null`/`undefined` → `[]`, non-array → `[value]`, array → same.
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Build a CSV string from an iterable of strings.
 * Options:
 *  - `filterEmpty`: drop empty/whitespace-only entries (default: true)
 *  - `dedupe`: remove duplicates (preserving first occurrence) (default: true)
 *  - `sort`: sort ascending (after dedupe) (default: true)
 */
export function toCsv(
  values: Iterable<string>,
  opts?: { filterEmpty?: boolean; dedupe?: boolean; sort?: boolean },
): string {
  const { filterEmpty = true, dedupe = true, sort = true } = opts ?? {};
  let arr = Array.from(values, (s) => String(s));

  if (filterEmpty) arr = arr.map((s) => s.trim()).filter((s) => s.length > 0);
  if (dedupe) {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const s of arr) {
      if (!seen.has(s)) {
        seen.add(s);
        deduped.push(s);
      }
    }
    arr = deduped;
  }
  if (sort) arr.sort();

  return arr.join(",");
}

/**
 * Narrow `unknown` to a plain object record.
 * - true for: {}, {a:1}, Object.create(null)
 * - false for: null, arrays, functions, Dates, Maps/Sets, class instances, objects with custom prototypes
 */
export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;

  // Avoid eslint no-unsafe-assignment by typing the result
  const proto: object | null = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}
