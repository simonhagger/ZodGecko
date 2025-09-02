/**
 * @file src/runtime/with-defaults.ts
 * @module runtime/with-defaults
 *
 * Runtime – withDefaults
 * ----------------------
 * Fill missing request fields with the documented server defaults for a route.
 * This does NOT affect `buildQuery` behavior; it's a separate convenience.
 */

import type { Endpoint } from "./endpoints.js";
import { getServerDefaults } from "./server-defaults.js";

/**
 * Returns a new object with any missing keys filled from the route's server defaults.
 * Provided keys are never overwritten.
 */
export function withDefaults<T extends Record<string, unknown>>(
  path: Endpoint,
  partial: T,
): T & Readonly<Record<string, unknown>> {
  const defaults = getServerDefaults(path);
  const out: Record<string, unknown> = { ...defaults, ...partial };
  // If a key exists in partial (even if undefined), prefer it over defaults.
  for (const k of Object.keys(partial)) {
    out[k] = partial[k];
  }
  return out as T & Record<string, unknown>;
}
