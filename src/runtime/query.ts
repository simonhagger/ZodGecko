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

import { normalizeDefault, normalizeValue, type QueryValue } from "../core/query.js";
import type { Endpoint } from "../index.js";
import { SERVER_DEFAULTS } from "./server-defaults.js";

/**
 * Build a normalized query object from an arbitrary input record.
 *
 * @typeParam T - Input record shape
 * @param endpoint - API path used to look up endpoint-specific defaults (e.g., "/coins/markets")
 * @param params - Query parameters object
 * @returns A normalized, stable set of query params
 */
export function buildQuery<T extends Record<string, unknown>>(
  endpoint: Endpoint,
  params: T,
): Record<string, string> {
  const out: Record<string, string> = {};
  const defaultsForEndpoint = (
    SERVER_DEFAULTS as Record<string, Record<string, unknown> | undefined>
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
