// External imports
// (none)

// Internal imports
import { GENERATED_REGISTRY } from "./generated.js";
import type { RegistryEndpoint, ZodLikeSchema } from "./types.js";
import type { QueryPrimitive, VersionPlanPair } from "../types/api.js";

export function listEndpoints(filter?: Partial<VersionPlanPair>): ReadonlyArray<RegistryEndpoint> {
  if (!filter) return GENERATED_REGISTRY;
  return GENERATED_REGISTRY.filter(
    (e) =>
      (filter.version ? e.validFor.version === filter.version : true) &&
      (filter.plan ? e.validFor.plan === filter.plan : true),
  );
}

export function getEndpointDefinition(
  id: string,
  validFor?: VersionPlanPair,
): RegistryEndpoint | null {
  if (!validFor) return GENERATED_REGISTRY.find((e) => e.id === id) ?? null;
  return (
    GENERATED_REGISTRY.find(
      (e) =>
        e.id === id && e.validFor.version === validFor.version && e.validFor.plan === validFor.plan,
    ) ?? null
  );
}

export function getServerDefaults(
  id: string,
  validFor?: VersionPlanPair,
): Readonly<Record<string, QueryPrimitive | readonly QueryPrimitive[]>> | null {
  const def = getEndpointDefinition(id, validFor);
  return def ? def.serverDefaults : null;
}

export function getQueryRules(
  id: string,
  validFor?: VersionPlanPair,
): RegistryEndpoint["queryRules"] | null {
  const def = getEndpointDefinition(id, validFor);
  return def ? def.queryRules : null;
}

export function getPathInfo(
  id: string,
  validFor?: VersionPlanPair,
): { pathTemplate: string; requiredPath: ReadonlyArray<string> } | null {
  const def = getEndpointDefinition(id, validFor);
  return def ? { pathTemplate: def.pathTemplate, requiredPath: def.requiredPath } : null;
}

/** Lookup the endpoint's response schema (Zod-like) or undefined if not found. */
export function getResponseSchema(id: string): ZodLikeSchema | undefined {
  const entry = GENERATED_REGISTRY.find((e) => e.id === id);
  return entry?.responseSchema as ZodLikeSchema | undefined;
}

/** Lookup the endpoint's request schema (Zod-like) or undefined if not found. */
export function getRequestSchema(id: string): ZodLikeSchema | undefined {
  const entry = GENERATED_REGISTRY.find((e) => e.id === id);
  return entry?.requestSchema as ZodLikeSchema | undefined;
}
