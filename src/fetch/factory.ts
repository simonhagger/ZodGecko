// src/fetch/factory.ts

// External imports
// (none)

// Internal imports
import { ZodGeckoFetch, type FetchClientOptions } from "./client.js";
import type { VersionPlanKey, VersionPlanPair } from "../types.js";
import { isValidVersionPlan, parseVersionPlanKey } from "../types.js";

/** Map a "vX.Y.Z/plan" key to a precise VersionPlanPair type. */
export type KeyToPair<K extends VersionPlanKey> = K extends `${infer V}/${infer P}`
  ? { version: V & VersionPlanPair["version"]; plan: P & VersionPlanPair["plan"] }
  : never;

/** Options when constructing via a VersionPlanKey (validFor is derived). */
export type KeyFetchOptions<K extends VersionPlanKey> = Omit<
  FetchClientOptions<KeyToPair<K>>,
  "validFor"
>;

/** Options when constructing via a VersionPlanPair (already provided). */
export type PairFetchOptions<V extends VersionPlanPair> = Omit<FetchClientOptions<V>, "validFor">;

/** Overload: create using an enum/string key like "v3.1.1/paid". */
export function createFetchClient<K extends VersionPlanKey>(
  key: K,
  opts?: KeyFetchOptions<K>,
): ZodGeckoFetch<KeyToPair<K>>;

/** Overload: create using a structured VersionPlanPair. */
export function createFetchClient<V extends VersionPlanPair>(
  pair: V,
  opts?: PairFetchOptions<V>,
): ZodGeckoFetch<V>;

/** Implementation. */
export function createFetchClient(
  arg: VersionPlanKey | VersionPlanPair,
  opts?: Omit<FetchClientOptions<VersionPlanPair>, "validFor">,
): ZodGeckoFetch<VersionPlanPair> {
  if (typeof arg === "string") {
    const pair = parseVersionPlanKey(arg);
    return new ZodGeckoFetch({ validFor: pair, ...opts });
  }
  if (!isValidVersionPlan(arg)) {
    throw new Error("Invalid VersionPlanPair passed to createFetchClient()");
  }
  return new ZodGeckoFetch({ validFor: arg, ...opts });
}
