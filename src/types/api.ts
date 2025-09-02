// src/types/api.ts

/** ------------------------------------------------------------------------
 *  Version / Plan (single source of truth)
 *  --------------------------------------------------------------------- */

export const VERSIONS = ["v3.0.1", "v3.1.1"] as const;
export type ApiVersion = (typeof VERSIONS)[number];

export const PLANS = ["public", "paid"] as const;
export type ApiPlan = (typeof PLANS)[number];

/** Mapping of supported version -> plan (only valid combos live here). */
export const VERSION_TO_PLAN: Readonly<Record<ApiVersion, ApiPlan>> = {
  "v3.0.1": "public",
  "v3.1.1": "paid",
} as const;

/** Enum-like for UI/selection: only valid pairs are present. */
export const VERSION_PLAN_ENUM = Object.freeze({
  V3_0_1__PUBLIC: "v3.0.1/public",
  V3_1_1__PAID: "v3.1.1/paid",
} as const);

export type VersionPlanKey = (typeof VERSION_PLAN_ENUM)[keyof typeof VERSION_PLAN_ENUM];

export type VersionPlanPair = Readonly<{
  version: ApiVersion;
  plan: ApiPlan;
}>;

/** List helpers (nice for UI selects). */
export function listSupportedVersions(): ReadonlyArray<ApiVersion> {
  return VERSIONS;
}
export function listSupportedPlans(): ReadonlyArray<ApiPlan> {
  return PLANS;
}
export function listSupportedVersionPlans(): ReadonlyArray<VersionPlanPair> {
  return VERSIONS.map((v) => ({ version: v, plan: VERSION_TO_PLAN[v] }));
}

/** Type guards. */
export function isValidVersion(x: unknown): x is ApiVersion {
  return typeof x === "string" && (VERSIONS as readonly string[]).includes(x);
}
export function isValidPlan(x: unknown): x is ApiPlan {
  return typeof x === "string" && (PLANS as readonly string[]).includes(x);
}
export function isValidVersionPlan(pair: unknown): pair is VersionPlanPair {
  if (!pair || typeof pair !== "object") return false;
  const p = pair as { version?: unknown; plan?: unknown };
  return isValidVersion(p.version) && VERSION_TO_PLAN[p.version] === p.plan;
}

/** Parse a "vX.Y.Z/plan" key into a structured pair. */
export function parseVersionPlanKey(key: VersionPlanKey): VersionPlanPair {
  const [version, plan] = key.split("/") as [ApiVersion, ApiPlan];
  return { version, plan };
}

/** Optional: tolerant parse for unknown strings (returns null on invalid). */
export function tryParseVersionPlanKey(key: string): VersionPlanPair | null {
  const parts = key.split("/");
  if (parts.length !== 2) return null;
  const [version, plan] = parts as [string, string];
  if (!isValidVersion(version) || VERSION_TO_PLAN[version] !== (plan as ApiPlan)) return null;
  return { version, plan: plan as ApiPlan };
}

/** ------------------------------------------------------------------------
 *  Query string primitives & Request shape
 *  --------------------------------------------------------------------- */

/** Allowed primitive types in query strings. */
export type QueryPrimitive = string | number | boolean;

/** An array of primitives (immutable) for CSV-style encodings. */
export type QueryArray = ReadonlyArray<QueryPrimitive>;

/** A single query value: either a primitive or a read-only array of them. */
export type QueryValue = QueryPrimitive | QueryArray;

/** A read-only map of query keys to values. */
export type QueryParams = Readonly<Record<string, QueryValue>>;

/** Path parameters are always strings (already encoded). */
export type PathParams = Readonly<Record<string, string>>;

/** The standard request shape used across helpers/clients. */
export type RequestShape = Readonly<{
  path?: PathParams;
  query?: QueryParams;
}>;
