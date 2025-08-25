/**
 * @file Shared test utilities for endpoint test suites.
 * @internal
 */

/* c8 ignore file */
import type { z } from "zod";

import { buildQuery, serverDefaults, type EndpointSet } from "../../../index.js";

// Generic: recursively mark all properties optional (for building partial fixtures)
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

/**
 * Expect a schema to reject a given value.
 */
export function expectInvalid<S extends z.ZodTypeAny>(schema: S, value: unknown): void {
  expect(() => schema.parse(value)).toThrow();
}

/**
 * Expect a schema to accept a given value (no result assignment → no unsafe-assignment).
 */
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
    delete copy[key]; // fully typed: key is keyof T, copy is T
  }
  return copy as Omit<T, K[number]>;
}

// Strongly-typed helper for the common {id} path param
export function dropId<T extends { id: unknown }>(params: T): Omit<T, "id"> {
  const { id: _id, ...rest } = params;
  void _id;
  return rest; // Omit<T, "id"> inferred
}

/**
 * Narrow `unknown` to a non-null object so we can safely do key checks
 * (e.g. `hasOwnProperty`) without any/unsafe-member-access.
 *
 * Why:
 * - Many response schemas are intentionally tolerant and parse to `unknown`.
 * - Accessing properties on `unknown` is unsafe; this guard lets us first
 *   prove “it’s an object” before checking keys.
 *
 * What it guarantees:
 * - Returns `true` for any non-null object (including arrays, Dates, etc.).
 * - Returns `false` for `null`, primitives, functions, and `undefined`.
 *
 * Notes:
 * - `Boolean(v)` (or `!!v`) filters out `null` in addition to other falsy values.
 * - Including arrays is OK for presence checks. If you need to restrict to
 *   *plain* objects only, use a stricter guard (see below).
 *
 * Example:
 *   if (isObjectRecord(row) && Object.prototype.hasOwnProperty.call(row, "some_field")) {
 *     // safe to assert presence without reading unknown properties
 *   }
 */
export function isObjectRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object";
}

/**
 * Like `isObjectRecord`, but restricted to plain object literals
 * (prototype is exactly `Object.prototype`).
 */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    Boolean(v) &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

/** Assert that a route has no defaults and serializes an empty query from `{}`. */
export function expectNoDefaultsAndEmptyQuery(endpoint: EndpointSet): void {
  expect(serverDefaults[endpoint]).toBeUndefined();
  expect(buildQuery(endpoint, {})).toEqual({});
}
/**
 * Drop common `{id}` and `{contract_address}` path params from a request object.
 * Returns an `Omit<T, "id" | "contract_address">` without using `any`.
 */
export function dropIdAndAddress<T extends { id: unknown; contract_address: unknown }>(
  params: T,
): Omit<T, "id" | "contract_address"> {
  const { id: _id, contract_address: _addr, ...rest } = params;
  void _id;
  void _addr;
  return rest;
}
/**
 * Drop `{market_id}` and `{id}` path params from a request object.
 * Returns an `Omit<T, "market_id" | "id">` without using `any`.
 */
export function dropMarketIdAndId<T extends { market_id: unknown; id: unknown }>(
  obj: T,
): Omit<T, "market_id" | "id"> {
  const { market_id: _m, id: _id, ...rest } = obj;
  void _m;
  void _id;
  return rest;
}
