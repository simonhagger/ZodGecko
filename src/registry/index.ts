/**
 * @file src/registry/index.ts
 * @module registry/index
 * @summary Index.
 */
// External imports
// (none)

// Internal imports
import { GENERATED_REGISTRY } from "./generated.js";
import type { RegistryEndpoint, ZodLikeSchema, QueryPrimitive, VersionPlanPair } from "../types.js";

export function listEndpoints(
  filter?: Partial<VersionPlanPair>,
): ReadonlyArray<(typeof GENERATED_REGISTRY)[number]> {
  if (!filter) return GENERATED_REGISTRY;
  return GENERATED_REGISTRY.filter(
    (e) =>
      (filter.version ? e.validFor.version === filter.version : true) &&
      (filter.plan ? e.validFor.plan === filter.plan : true),
  );
}

export function getEndpointDefinition(
  path: string,
  validFor?: VersionPlanPair,
): (typeof GENERATED_REGISTRY)[number] | null {
  if (!validFor) return GENERATED_REGISTRY.find((e) => e.pathTemplate === path) ?? null;
  return (
    GENERATED_REGISTRY.find(
      (e) =>
        e.pathTemplate === path &&
        e.validFor.version === validFor.version &&
        e.validFor.plan === validFor.plan,
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
  path: string,
  validFor?: VersionPlanPair,
): RegistryEndpoint["queryRules"] | null {
  const def = getEndpointDefinition(path, validFor);
  return def ? def.queryRules : null;
}

export function getPathInfo(
  path: string,
  validFor?: VersionPlanPair,
): { pathTemplate: string; requiredPath: ReadonlyArray<string> } | null {
  const def = getEndpointDefinition(path, validFor);
  return def ? { pathTemplate: def.pathTemplate, requiredPath: def.requiredPath } : null;
}

/** Lookup the endpoint's response schema (Zod-like) or undefined if not found. */
export function getResponseSchema(path: string): ZodLikeSchema | undefined {
  const entry = GENERATED_REGISTRY.find((e) => e.pathTemplate === path);
  return entry?.responseSchema as ZodLikeSchema | undefined;
}

/** Lookup the endpoint's request schema (Zod-like) or undefined if not found. */
export function getRequestSchema(path: string): ZodLikeSchema | undefined {
  const entry = GENERATED_REGISTRY.find((e) => e.pathTemplate === path);
  return entry?.requestSchema as ZodLikeSchema | undefined;
}
