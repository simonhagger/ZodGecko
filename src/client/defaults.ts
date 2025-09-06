/**
 * @file src/client/defaults.ts
 * @module client/defaults
 * @summary Defaults.
 */
// src/client/defaults.ts
import type { VersionPlanKey, VersionPlanPair, ApiPlan, DerivedVersionPlanKey } from "../types.js";

export const DEFAULT_BASE_BY_VERSION: Readonly<Record<DerivedVersionPlanKey, string>> = {
  "v3.0.1/public": "https://api.coingecko.com/api/v3",
} as const;

export function defaultBaseFor(vp: VersionPlanKey | VersionPlanPair): string {
  const key = typeof vp === "string" ? vp : `${vp.version}/${vp.plan}`;
  // fall back by plan just in case a new pair is added before this table is updated
  const plan = typeof vp === "string" ? (key.split("/")[1] as ApiPlan) : vp.plan;
  return (
    (DEFAULT_BASE_BY_VERSION as Record<string, string>)[key] ??
    (plan === "paid" ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3")
  );
}
