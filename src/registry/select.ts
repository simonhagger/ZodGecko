import { GENERATED_REGISTRY } from "./generated.js";
import type { EndpointIdFor, EntryFor, VersionPlanPair } from "../types.js";

// Runtime helpers (pure)
export function selectEntries<V extends VersionPlanPair>(validFor: V): ReadonlyArray<EntryFor<V>> {
  // Filter with runtime predicate; type is preserved by the generic return
  return GENERATED_REGISTRY.filter(
    (e): e is EntryFor<V> =>
      e.validFor.version === validFor.version && e.validFor.plan === validFor.plan,
  ) as ReadonlyArray<EntryFor<V>>;
}

export function selectEntryMap<V extends VersionPlanPair>(
  validFor: V,
): Readonly<Record<EndpointIdFor<V>, EntryFor<V>>> {
  const entries = selectEntries(validFor);

  const map = new Map<EndpointIdFor<V>, EntryFor<V>>();
  for (const e of entries) {
    map.set(e.id as EndpointIdFor<V>, e);
  }

  // Convert once at the end; this is clean and keeps per-insert O(1)
  return Object.freeze(Object.fromEntries(map)) as Readonly<Record<EndpointIdFor<V>, EntryFor<V>>>;
}
