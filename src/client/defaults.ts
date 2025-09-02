// External imports
// (none)

// Internal imports
import type { VersionPlanKey } from "../types/api.js";

/** Stable default bases by Version/Plan; evolves per API release. */
export const DEFAULT_BASE_BY_VERSION: Readonly<Record<VersionPlanKey, string>> = {
  "v3.0.1/public": "https://api.coingecko.com/api/v3",
  "v3.1.1/paid": "https://pro-api.coingecko.com/api/v3",
} as const;

/** Helper to resolve the default base for a given key. */
export function defaultBaseFor(key: VersionPlanKey): string {
  return DEFAULT_BASE_BY_VERSION[key];
}
