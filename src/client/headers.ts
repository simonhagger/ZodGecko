// src/client/headers.ts
import type { ApiPlan, HeadersInitLike, VersionPlanKey, VersionPlanPair } from "../types.js";

export function headerNameForPlan(plan: ApiPlan): "x-cg-demo-api-key" | "x-cg-pro-api-key" {
  return plan === "paid" ? "x-cg-pro-api-key" : "x-cg-demo-api-key";
}

function planOf(vp: VersionPlanKey | VersionPlanPair): ApiPlan {
  return typeof vp === "string" ? (vp.split("/")[1] as ApiPlan) : vp.plan;
}

export type HeaderOptions = Readonly<{
  /** API key to include; omit to send no auth header. */
  apiKey?: string;
  /** Extra headers to merge (later wins). */
  extra?: HeadersInitLike | (() => HeadersInitLike);
}>;

/** Deterministic default headers for CoinGecko requests. */
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
