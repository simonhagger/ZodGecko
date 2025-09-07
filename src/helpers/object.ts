/**
 * @file src/helpers/object.ts
 * @module helpers/object
 * @summary Object.
 */

import type { ApiVersion, ApiPlan, VersionPlanPair, VersionPlanKey } from "../types.js";
import { VERSIONS, PLANS, VERSION_TO_PLAN } from "./constants.js";

/**
 * Narrow record type for Object.* helpers (string keys only).
 * @remarks Type: { [x: string]: unknown; }
 */
export type AnyRecord = Record<string, unknown>;

/**
 * Typed Object.keys — string keys only (symbols are intentionally excluded).
 * @param o (required: T)
 * @returns Array
 */
export const keysOf = <T extends AnyRecord>(o: T): Array<keyof T & string> =>
  Object.keys(o) as Array<keyof T & string>;

/**
 * Typed Object.entries — string keys only.
 * @param o (required: T)
 * @returns Array
 */
export const entriesOf = <T extends AnyRecord>(o: T): Array<[keyof T & string, T[keyof T]]> =>
  Object.entries(o) as Array<[keyof T & string, T[keyof T]]>;

/**
 * Typed Object.values.
 * @param o (required: T)
 * @returns Array
 */
export const valuesOf = <T extends AnyRecord>(o: T): Array<T[keyof T]> =>
  Object.values(o) as Array<T[keyof T]>;

/**
 * Strict, typed fromEntries for string keys (no `any`, no unsafe access).
 * @param entries (required: Iterable)
 * @returns object
 */
export function fromEntriesStrict<K extends string, V>(
  entries: Iterable<readonly [K, V]>,
): Record<K, V> {
  const out = {} as Record<K, V>;
  for (const [k, v] of entries) out[k] = v;
  return out;
}

// -- Utilities ---------------------------------------------------------------

/**
 * List the supported versions (for menus or validation).
 * @returns ReadonlyArray
 */
export function listSupportedVersions(): ReadonlyArray<ApiVersion> {
  return VERSIONS;
}
/**
 * List the supported plans (for menus or validation).
 * @returns ReadonlyArray
 */
export function listSupportedPlans(): ReadonlyArray<ApiPlan> {
  return PLANS;
}
/**
 * List the supported (version, plan) pairs (derived from VERSION_TO_PLAN).
 * @returns ReadonlyArray
 */
export function listSupportedVersionPlans(): ReadonlyArray<VersionPlanPair> {
  return VERSIONS.map((v) => ({ version: v, plan: VERSION_TO_PLAN[v] }));
}

/**
 * Type guard: is the value a valid {@link ApiVersion}.
 * @param x (required: unknown)
 * @returns boolean
 */
export function isValidVersion(x: unknown): x is ApiVersion {
  return typeof x === "string" && (VERSIONS as readonly string[]).includes(x);
}
/**
 * Type guard: is the value a valid {@link ApiPlan}.
 * @param x (required: unknown)
 * @returns boolean
 */
export function isValidPlan(x: unknown): x is ApiPlan {
  return typeof x === "string" && (PLANS as readonly string[]).includes(x);
}
/**
 * Type guard for a coherent {@link VersionPlanPair}.
 * @param pair (required: unknown)
 * @returns boolean
 */
export function isValidVersionPlan(pair: unknown): pair is VersionPlanPair {
  if (!pair || typeof pair !== "object") return false;
  const p = pair as { version?: unknown; plan?: unknown };
  return isValidVersion(p.version) && VERSION_TO_PLAN[p.version] === p.plan;
}

/**
 * Parse a {@link VersionPlanKey} like "vX.Y.Z/plan" into a structured pair.
 * @param key (required: "v3.0.1/public" | "v3.0.1/paid" | "v3.1.1/public" | "v3.1.1/paid")
 * @returns object
 */
export function parseVersionPlanKey(key: VersionPlanKey): VersionPlanPair {
  const [version, plan] = key.split("/") as [ApiVersion, ApiPlan];
  return { version, plan };
}

/**
 * Tolerant parse from an arbitrary string; returns `null` on invalid.
 * @param key (required: string)
 * @returns null | object
 */
export function tryParseVersionPlanKey(key: string): VersionPlanPair | null {
  const parts = key.split("/");
  if (parts.length !== 2) return null;
  const [version, plan] = parts as [string, string];
  if (!isValidVersion(version) || VERSION_TO_PLAN[version] !== (plan as ApiPlan)) return null;
  return { version, plan: plan as ApiPlan };
}
