/**
 * @file src/runtime/query.ts
 * @module runtime/query
 *
 * Query string serialization utilities.
 *
 * Responsibilities:
 *  - Alphabetize keys for deterministic cache keys
 *  - Normalize values to strings using consistent rules
 *  - Handle arrays (stable, deduped CSV)
 *  - Drop empty/undefined/null/invalid values
 *  - Drop params that match documented server defaults (per-endpoint)
 */

import { serverDefaults } from "./server-defaults.js";

type QueryPrimitive = string | number | boolean | null | undefined;
type QueryValue = QueryPrimitive | QueryPrimitive[];

/**
 * Normalize a single primitive into a string suitable for a querystring,
 * or return `undefined` to indicate it should be dropped.
 */
function normalizePrimitive(v: QueryPrimitive): string | undefined {
  if (v === undefined || v === null) return undefined;

  switch (typeof v) {
    case "string": {
      const trimmed = v.trim();
      return trimmed.length ? trimmed : undefined;
    }
    case "number":
      return Number.isFinite(v) ? String(v) : undefined;
    case "boolean":
      return v ? "true" : "false";
    default:
      return undefined;
  }
}

/**
 * Normalize an arbitrary query value (scalar or array) to a **string**.
 * Arrays are deduped and sorted to produce a stable CSV.
 */
function normalizeValue(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    const parts = value.map(normalizePrimitive).filter((s): s is string => s !== undefined);

    // Refactor: remove separate early return line; compute CSV then decide.
    const csv = Array.from(new Set(parts)).sort().join(",");
    return csv.length ? csv : undefined;
  }

  return normalizePrimitive(value);
}

/** Normalize a server default using the same rules as query values. */
function normalizeDefault(v: unknown): string | undefined {
  return Array.isArray(v)
    ? normalizeValue(v as QueryValue)
    : normalizePrimitive(v as QueryPrimitive);
}

/**
 * Build a normalized query object from an arbitrary input record.
 *
 * @typeParam T - Input record shape
 * @param endpoint - API path used to look up endpoint-specific defaults (e.g., "/coins/markets")
 * @param params - Query parameters object
 * @returns A normalized, stable set of query params
 */
export function buildQuery<T extends Record<string, unknown>>(
  endpoint: string,
  params: T,
): Record<string, string> {
  const out: Record<string, string> = {};
  const defaultsForEndpoint = (
    serverDefaults as Record<string, Record<string, unknown> | undefined>
  )[endpoint];

  for (const key of Object.keys(params).sort()) {
    const normalized = normalizeValue(params[key] as QueryValue);
    if (normalized === undefined) continue;

    // Refactor: compute defaultStr once; single equality check controls the drop.
    const defaultStr =
      defaultsForEndpoint && Object.prototype.hasOwnProperty.call(defaultsForEndpoint, key)
        ? normalizeDefault(defaultsForEndpoint[key])
        : undefined;

    if (defaultStr !== undefined && defaultStr === normalized) {
      // Drop param because it's equal to the documented server default
      continue;
    }

    out[key] = normalized;
  }

  return out;
}
