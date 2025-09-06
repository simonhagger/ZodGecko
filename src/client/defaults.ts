/**
 * @file src/client/defaults.ts
 * @module client/defaults
 * @summary Defaults.
 */
// src/client/defaults.ts
import type { VersionPlanKey, VersionPlanPair, ApiPlan, DerivedVersionPlanKey } from "../types.js";

/**
 * Constant DEFAULT_BASE_BY_VERSION.
 * @remarks Type: Readonly<Record<DerivedVersionPlanKey, string>>
 */
export const DEFAULT_BASE_BY_VERSION: Readonly<Record<DerivedVersionPlanKey, string>> = {
  "v3.0.1/public": "https://api.coingecko.com/api/v3",
} as const;

/**
 * Function defaultBaseFor.
 * @param vp (required: object | "v3.0.1/public" | "v3.0.1/paid" | "v3.1.1/public" | "v3.1.1/paid")
 * @returns string
 */
export function defaultBaseFor(vp: VersionPlanKey | VersionPlanPair): string {
  const key = typeof vp === "string" ? vp : `${vp.version}/${vp.plan}`;
  // fall back by plan just in case a new pair is added before this table is updated
  const plan = typeof vp === "string" ? (key.split("/")[1] as ApiPlan) : vp.plan;
  return (
    (DEFAULT_BASE_BY_VERSION as Record<string, string>)[key] ??
    (plan === "paid" ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3")
  );
}
