/**
 * @file src/client/factory.ts
 * @module client/factory
 * @summary Factory.
 */
// External imports
// (none)

// Internal imports
import { ZodGecko } from "./api.js";
import { isValidVersionPlan, parseVersionPlanKey } from "../helpers/object.js";
import type { VersionPlanKey, VersionPlanPair, ClientOptions } from "../types.js";

/**
 * Map a "vX.Y.Z/plan" key to a precise VersionPlanPair type.
 * @remarks Type: `${infer V}/${infer P}`
 */
export type KeyToPair<K extends VersionPlanKey> = K extends `${infer V}/${infer P}`
  ? { version: V & VersionPlanPair["version"]; plan: P & VersionPlanPair["plan"] }
  : never;

/**
 * Options when constructing via a VersionPlanKey (validFor is derived).
 * @property baseURL (optional: string)
 */
export type KeyClientOptions<K extends VersionPlanKey> = Omit<
  ClientOptions<KeyToPair<K>>,
  "validFor"
>;

/**
 * Options when constructing via a VersionPlanPair (already provided).
 * @property baseURL (optional: string)
 */
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
/**
 * Function createClient.
 * @param arg (required: VersionPlanPair | "v3.0.1/public" | "v3.0.1/paid" | "v3.1.1/public" | "v3.1.1/paid")
 * @param opts (optional: { baseURL?: string; } | undefined)
 * @returns ZodGecko
 */
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
