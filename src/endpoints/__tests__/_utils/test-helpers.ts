/**
 * @file Shared test utilities for endpoint test suites.
 * @internal
 */

/* c8 ignore file */
import type { z } from "zod";

import { buildQuery, dropParams, getServerDefaults, type Endpoint } from "../../../index.js";

// Re-export library helpers so tests don’t import from deep paths
export { dropParams, dropId } from "../../../core/helpers.js";

// Generic: recursively mark all properties optional (for building partial fixtures)
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

/** Expect a schema to reject a given value. */
export function expectInvalid<S extends z.ZodTypeAny>(schema: S, value: unknown): void {
  expect(() => schema.parse(value)).toThrow();
}

/** Expect a schema to accept a given value (no result assignment → no unsafe-assignment). */
export function expectValid<S extends z.ZodTypeAny>(schema: S, value: unknown): void {
  expect(() => schema.parse(value)).not.toThrow();
}

/**
 * Drop `{param}`s that belong in the path from a request object before building the query.
 * Returns a shallow copy without those keys.
 */
export function dropPathParams<T extends Record<string, unknown>>(
  endpoint: string,
  params: T,
): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...params };
  const matches = endpoint.matchAll(/\{([^}]+)\}/g);
  for (const m of matches) {
    const key = m[1];
    delete copy[key];
  }
  return copy;
}

/**
 * Strongly-typed version when you KNOW the path keys.
 * Returns Omit<T, K> so your `q` variable keeps precise types.
 */
export function dropPathParamsTyped<
  T extends Record<string, unknown>,
  const K extends readonly (keyof T)[],
>(params: T, keys: K): Omit<T, K[number]> {
  const copy: T = { ...params };
  for (const key of keys) {
    delete (copy as Record<string, unknown>)[key as string];
  }
  return copy as Omit<T, K[number]>;
}

/** Narrow `unknown` to a non-null object so we can safely do presence checks. */
export function isObjectRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object";
}

/** Like `isObjectRecord`, but restricted to plain object literals. */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    Boolean(v) &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

/** Assert that a route has no defaults and serializes an empty query from `{}`. */
export function expectNoDefaultsAndEmptyQuery(endpoint: Endpoint): void {
  expect(getServerDefaults(endpoint)).toEqual({});
  expect(buildQuery(endpoint, {})).toEqual({});
}

/** Drop common `{id}` and `{contract_address}` path params (delegates to core.dropParams). */
export function dropIdAndAddress<T extends { id: unknown; contract_address: unknown }>(
  params: T,
): Omit<T, "id" | "contract_address"> {
  // imported from core/helpers.js
  return dropParams(params, ["id", "contract_address"] as const);
}

/** Drop `{market_id}` and `{id}` path params (delegates to core.dropParams). */
export function dropMarketIdAndId<T extends { market_id: unknown; id: unknown }>(
  obj: T,
): Omit<T, "market_id" | "id"> {
  return dropParams(obj, ["market_id", "id"] as const);
}
