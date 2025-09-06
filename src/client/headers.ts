/**
 * @file src/client/headers.ts
 * @module client/headers
 * @summary Headers.
 */
// src/client/headers.ts
import type { ApiPlan, HeadersInitLike, VersionPlanKey, VersionPlanPair } from "../types.js";

/**
 * Function headerNameForPlan.
 * @param plan (required: "public" | "paid")
 * @returns "x-cg-demo-api-key" | "x-cg-pro-api-key"
 */
export function headerNameForPlan(plan: ApiPlan): "x-cg-demo-api-key" | "x-cg-pro-api-key" {
  return plan === "paid" ? "x-cg-pro-api-key" : "x-cg-demo-api-key";
}

function planOf(vp: VersionPlanKey | VersionPlanPair): ApiPlan {
  return typeof vp === "string" ? (vp.split("/")[1] as ApiPlan) : vp.plan;
}

/**
 * Type alias HeaderOptions.
 * @property apiKey (optional: string).
 * @property extra (optional: HeadersInitLike | (() => HeadersInitLike)).
 */
export type HeaderOptions = Readonly<{
  /** API key to include; omit to send no auth header. */
  apiKey?: string;
  /** Extra headers to merge (later wins). */
  extra?: HeadersInitLike | (() => HeadersInitLike);
}>;

/**
 * Deterministic default headers for CoinGecko requests.
 * @param vp (required: object | "v3.0.1/public" | "v3.0.1/paid" | "v3.1.1/public" | "v3.1.1/paid")
 * @param opts (optional: undefined | object)
 * @returns HeadersInitLike
 */
export function defaultHeadersFor(
  vp: VersionPlanKey | VersionPlanPair,
  opts?: HeaderOptions,
): HeadersInitLike {
  const base: Record<string, string> = { accept: "application/json" };

  if (opts?.apiKey) {
    base[headerNameForPlan(planOf(vp))] = opts.apiKey;
  }

  if (!opts?.extra) return base;
  const more = typeof opts.extra === "function" ? opts.extra() : opts.extra;
  return { ...base, ...more };
}
