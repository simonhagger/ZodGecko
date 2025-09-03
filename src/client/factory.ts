// External imports
// (none)

// Internal imports
import { ZodGecko, type ClientOptions } from "./api.js";
import type { VersionPlanKey, VersionPlanPair } from "../types.js";
import { isValidVersionPlan, parseVersionPlanKey } from "../types.js";

/** Map a "vX.Y.Z/plan" key to a precise VersionPlanPair type. */
export type KeyToPair<K extends VersionPlanKey> = K extends `${infer V}/${infer P}`
  ? { version: V & VersionPlanPair["version"]; plan: P & VersionPlanPair["plan"] }
  : never;

/** Options when constructing via a VersionPlanKey (validFor is derived). */
export type KeyClientOptions<K extends VersionPlanKey> = Omit<
  ClientOptions<KeyToPair<K>>,
  "validFor"
>;

/** Options when constructing via a VersionPlanPair (already provided). */
export type PairClientOptions<V extends VersionPlanPair> = Omit<ClientOptions<V>, "validFor">;

// Overloads
export function createClient<K extends VersionPlanKey>(
  key: K,
  opts?: KeyClientOptions<K>,
): ZodGecko<KeyToPair<K>>;
export function createClient<V extends VersionPlanPair>(
  pair: V,
  opts?: PairClientOptions<V>,
): ZodGecko<V>;

// Impl
export function createClient(
  arg: VersionPlanKey | VersionPlanPair,
  opts?: { baseURL?: string },
): ZodGecko<VersionPlanPair> {
  if (typeof arg === "string") {
    const pair = parseVersionPlanKey(arg);
    return new ZodGecko({ validFor: pair, baseURL: opts?.baseURL });
  }
  if (!isValidVersionPlan(arg)) {
    throw new Error("Invalid VersionPlanPair passed to createClient()");
  }
  return new ZodGecko({ validFor: arg, baseURL: opts?.baseURL });
}
