import { GENERATED_REGISTRY } from "./generated.js";
import type { VersionPlanPair } from "../types/api.js";

// The union type of all generated entries (keeps literal ids/types)
export type RegistryShape = (typeof GENERATED_REGISTRY)[number];

export type EntryFor<V extends VersionPlanPair> = Extract<RegistryShape, { validFor: V }>;
export type EndpointIdFor<V extends VersionPlanPair> = EntryFor<V>["id"];

// Runtime helpers (pure)
export function selectEntries<V extends VersionPlanPair>(validFor: V): ReadonlyArray<EntryFor<V>> {
  // Filter with runtime predicate; type is preserved by the generic return
  return GENERATED_REGISTRY.filter(
    (e): e is EntryFor<V> =>
      e.validFor.version === validFor.version && e.validFor.plan === validFor.plan,
  );
}

export function selectEntryMap<V extends VersionPlanPair>(
  validFor: V,
): Readonly<Record<EndpointIdFor<V>, EntryFor<V>>> {
  const out: Record<string, EntryFor<V>> = {};
  for (const e of selectEntries(validFor)) {
    out[e.id] = e;
  }
  return out as Readonly<Record<EndpointIdFor<V>, EntryFor<V>>>;
}
