/**
 * @file src/registry/select.ts
 * @module registry/select
 * @summary Select.
 */
import { GENERATED_REGISTRY } from "./generated.js";
import type { EndpointIdFor, EntryFor, RegistryEntry, VersionPlanPair } from "../types.js";

// Runtime helpers (pure)
/**
 * Function selectEntries.
 * @param validFor (required: V)
 * @returns ReadonlyArray
 */
export function selectEntries<V extends VersionPlanPair>(validFor: V): ReadonlyArray<EntryFor<V>> {
  return GENERATED_REGISTRY.filter(
    (e): e is EntryFor<V> =>
      e.validFor.version === validFor.version && e.validFor.plan === validFor.plan,
  );
}

/**
 * Function selectEntryMap.
 * @param validFor (required: V)
 * @returns object
 */
export function selectEntryMap<V extends VersionPlanPair>(
  validFor: V,
): Readonly<Record<EndpointIdFor<V>, RegistryEntry>> {
  const entries = selectEntries(validFor);

  const map = new Map<EndpointIdFor<V>, RegistryEntry>();
  for (const e of entries) {
    map.set(e.id as EndpointIdFor<V>, e);
  }

  // Convert once at the end; this is clean and keeps per-insert O(1)
  return Object.freeze(Object.fromEntries(map)) as Readonly<Record<EndpointIdFor<V>, EntryFor<V>>>;
}
