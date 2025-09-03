/**
 * @file src/types.ts
 * @module types
 * @summary Canonical shared types for ZodGecko.
 *
 * @remarks
 * One file to rule them all:
 *  - Version/plan pairs & helpers
 *  - Query primitives & request shape
 *  - Normalization policies & schema interfaces
 *  - Registry descriptors (runtime shape)
 *  - **Derived unions** from the generated registry (paths/ids per version/plan)
 *
 * Design principles:
 *  - No runtime imports from test code.
 *  - Keep this module **types-first**; the only import is a *types-only* import
 *    from the generated registry for derived unions. This avoids runtime cycles.
 */

// ===========================================================================
//  Version / Plan (single source of truth)
// ===========================================================================

/** Supported API versions. Keep in sync with codegen & docs. */
export const VERSIONS = ["v3.0.1", "v3.1.1"] as const;
/** Union of supported API versions. */
export type ApiVersion = (typeof VERSIONS)[number];

/** Supported API plans/channels. */
export const PLANS = ["public", "paid"] as const;
/** Union of supported API plans. */
export type ApiPlan = (typeof PLANS)[number];

/** Mapping of supported version → plan (only valid combos live here). */
export const VERSION_TO_PLAN: Readonly<Record<ApiVersion, ApiPlan>> = {
  "v3.0.1": "public",
  "v3.1.1": "paid",
} as const;

/** Structured pair describing a specific API surface (version + plan). */
export type VersionPlanPair = Readonly<{
  /** API version (e.g. "v3.0.1"). */
  version: ApiVersion;
  /** Plan/channel (e.g. "public" | "paid"). */
  plan: ApiPlan;
}>;

/** String literal of the valid version/plan key (e.g. "v3.0.1/public"). */
export type VersionPlanKey = `${ApiVersion}/${ApiPlan}`;

/** Build a key from a {@link VersionPlanPair}. */
export type VersionPlanKeyFromPair<V extends VersionPlanPair> = `${V["version"]}/${V["plan"]}`;

// -- Utilities ---------------------------------------------------------------

/** List the supported versions (for menus or validation). */
export function listSupportedVersions(): ReadonlyArray<ApiVersion> {
  return VERSIONS;
}
/** List the supported plans (for menus or validation). */
export function listSupportedPlans(): ReadonlyArray<ApiPlan> {
  return PLANS;
}
/** List the supported (version, plan) pairs (derived from VERSION_TO_PLAN). */
export function listSupportedVersionPlans(): ReadonlyArray<VersionPlanPair> {
  return VERSIONS.map((v) => ({ version: v, plan: VERSION_TO_PLAN[v] }));
}

/** Type guard: is the value a valid {@link ApiVersion}. */
export function isValidVersion(x: unknown): x is ApiVersion {
  return typeof x === "string" && (VERSIONS as readonly string[]).includes(x);
}
/** Type guard: is the value a valid {@link ApiPlan}. */
export function isValidPlan(x: unknown): x is ApiPlan {
  return typeof x === "string" && (PLANS as readonly string[]).includes(x);
}
/** Type guard for a coherent {@link VersionPlanPair}. */
export function isValidVersionPlan(pair: unknown): pair is VersionPlanPair {
  if (!pair || typeof pair !== "object") return false;
  const p = pair as { version?: unknown; plan?: unknown };
  return isValidVersion(p.version) && VERSION_TO_PLAN[p.version] === p.plan;
}

/** Parse a {@link VersionPlanKey} like "vX.Y.Z/plan" into a structured pair. */
export function parseVersionPlanKey(key: VersionPlanKey): VersionPlanPair {
  const [version, plan] = key.split("/") as [ApiVersion, ApiPlan];
  return { version, plan };
}

/** Tolerant parse from an arbitrary string; returns `null` on invalid. */
export function tryParseVersionPlanKey(key: string): VersionPlanPair | null {
  const parts = key.split("/");
  if (parts.length !== 2) return null;
  const [version, plan] = parts as [string, string];
  if (!isValidVersion(version) || VERSION_TO_PLAN[version] !== (plan as ApiPlan)) return null;
  return { version, plan: plan as ApiPlan };
}

// ===========================================================================
//  Query string primitives & Request shape
// ===========================================================================

/** Allowed primitive types in query strings. */
export type QueryPrimitive = string | number | boolean;
/** Read‑only array of primitives (CSV‑style encodings). */
export type QueryArray = ReadonlyArray<QueryPrimitive>;
/** A single query value: a primitive or an immutable array of primitives. */
export type QueryValue = QueryPrimitive | QueryArray;
/** Read‑only map of query keys to values. */
export type QueryParams = Readonly<Record<string, QueryValue>>;
/** Path parameters are strings (already URL‑encoded). */
export type PathParams = Readonly<Record<string, string>>;

/**
 * Canonical request shape used across helpers & client.
 *
 * @example
 * ```ts
 * const req: RequestShape = {
 *   path: { id: "bitcoin" },
 *   query: { vs_currency: "usd", days: 1 }
 * };
 * ```
 */
export type RequestShape = Readonly<{
  /** Path parameters (template substitutions). */
  path?: PathParams;
  /** Querystring parameters (before normalization). */
  query?: QueryParams;
}>;

/** A concrete endpoint path template (API surface). */
export type EndpointPath = string; // e.g., "/coins/{id}/ohlc"

// ===========================================================================
//  Normalization policies & schema interfaces
// ===========================================================================

/** Encoding policy for array‑like query params. MVP: "csv" only; extensible later. */
export type ArrayEncoding = "csv";

/** Minimal Zod‑like shape (no runtime dependency on zod). */
export type ZodLikeSchema = Readonly<{ parse: (x: unknown) => unknown }>;

/** Minimal validator interface; can be backed by Zod internally. */
export type Schema<T> = Readonly<{ parse: (value: unknown) => T }>;

/** Declarative rule for a single query parameter. */
export type QueryRule = Readonly<{
  /** Query key (as documented by CoinGecko). */
  key: string;
  /** Server default value (single source of truth) if any. */
  default?: QueryPrimitive | ReadonlyArray<QueryPrimitive>;
  /** Drop from querystring when value equals its default. Default: `true`. */
  dropWhenDefault?: boolean;
  /** Array serialization policy (MVP: CSV). */
  arrayEncoding?: ArrayEncoding;
  /** True when the key is mandatory in the querystring. */
  required?: true;
}>;

/** HTTP methods used by the registry (most endpoints are GET). */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// ===========================================================================
//  Registry descriptors (runtime shape)
// ===========================================================================

/**
 * A single endpoint definition in the runtime registry.
 *
 * @template Req - Parsed request type (schema output).
 * @template Res - Parsed response type (schema output).
 */
export type RegistryEndpoint<Req = unknown, Res = unknown> = Readonly<{
  /** Dot + `by-<param>` slug, e.g. "coins.by-id.history". */
  id: string;
  /** Valid version/plan pair. */
  validFor: VersionPlanPair;
  /** HTTP method (usually GET). */
  method: HttpMethod;
  /** API path template, e.g. "/coins/{id}/history". */
  pathTemplate: EndpointPath;
  /** Required path param names (e.g., ["id", "contract_address"]). */
  requiredPath: ReadonlyArray<string>;
  /** Required query param names (as strings). */
  requiredQuery: ReadonlyArray<string>;
  /** Declarative query rules (defaults + drop policy + encoding). */
  queryRules: ReadonlyArray<QueryRule>;
  /** Raw map of server defaults (derived). */
  serverDefaults: Readonly<Record<string, QueryPrimitive | ReadonlyArray<QueryPrimitive>>>;
  /** Optional request validator (pluggable). */
  requestSchema?: Schema<Req>;
  /** Optional response validator (pluggable). */
  responseSchema?: Schema<Res>;
}>;

// ===========================================================================
//  Derived unions from the generated registry (paths/ids per version/plan)
// ===========================================================================

// IMPORTANT: types‑only import to avoid runtime cycles.
import type { GENERATED_REGISTRY } from "./registry/generated.js";

/** Single registry entry (const‑derived). */
export type RegistryEntry = (typeof GENERATED_REGISTRY)[number];

// -- Helpers to pluck version/plan literals from a pair or entry -------------
export type VPVersion<V> = V extends { readonly version: infer Ver extends string }
  ? Ver
  : V extends { version: infer Ver2 extends string }
    ? Ver2
    : never;

export type VPPlan<V> = V extends { readonly plan: infer Pl extends string }
  ? Pl
  : V extends { plan: infer Pl2 extends string }
    ? Pl2
    : never;

export type VersionPlanKeyFromPairLoose<V> = `${VPVersion<V>}/${VPPlan<V>}`;

/** Union of all version/plan keys present in the generated registry. */
export type DerivedVersionPlanKey = RegistryEntry extends {
  readonly validFor: {
    readonly version: infer Ver extends string;
    readonly plan: infer Pl extends string;
  };
}
  ? `${Ver}/${Pl}`
  : never;

/** Narrow entries to those matching a `{ version, plan }` pair. */
export type MatchByVersionPlan<E, V> = E extends {
  readonly validFor: { readonly version: VPVersion<V>; readonly plan: VPPlan<V> };
}
  ? E
  : never;

/** Entry type for a specific `{ version, plan }`. */
export type EntryFor<V> = MatchByVersionPlan<RegistryEntry, V>;

/** Union of API path templates valid for a given `{ version, plan }`. */
export type EndpointPathFor<V> = EntryFor<V>["pathTemplate"];

/** Union of endpoint ids valid for a given `{ version, plan }` (kept for internal use). */
export type EndpointIdFor<V> = EntryFor<V>["id"];

/** Union of *all* path templates present in the registry (any version/plan). */
export type AnyEndpointPath = RegistryEntry["pathTemplate"];

/** Union of *all* endpoint ids present in the registry (any version/plan). */
export type AnyEndpointId = RegistryEntry["id"];

// ===========================================================================
//  Path‑template param extraction helpers (DX niceties)
// ===========================================================================

/** Extract the set of `{placeholder}` names from a path template. */
export type ExtractPathParams<
  P extends string,
  Acc extends string = never,
> = P extends `${string}{${infer K}}${infer R}` ? ExtractPathParams<R, Acc | K> : Acc;

/** Lint-safe empty object type (no keys permitted). */
export type EmptyObject = Record<never, never>;

/** Build the `path` shape for a given path template. */
export type PathArgs<P extends string> = [ExtractPathParams<P>] extends [never]
  ? EmptyObject
  : { path: Readonly<Record<ExtractPathParams<P>, string>> };

/** Request shape specialized for a given path template. */
export type RequestShapeFor<P extends string> = Readonly<PathArgs<P> & { query?: QueryParams }>;

// ===========================================================================
//  (Optional) Public re-exports for convenience
// ===========================================================================

export type {
  // Aliases kept for back-compat in internal modules
  RegistryEntry as RuntimeRegistryEntry,
};

// ===========================================================================
//  Minimal, cross-env headers types (no DOM lib required).
// ===========================================================================

/** HeaderTuple is a tuple of two strings: `name` and `value`. */
export type HeaderTuple = readonly [string, string];

//** HeadersLike is a type that can be used to represent a set of HTTP headers. With minimal functionality. */
export type HeadersLike = {
  get(name: string): string | null; // enough for reads
};

/** HeadersInitLike is a type that can be used to represent a set of HTTP headers. With minimal functionality. */
export type HeadersInitLike =
  | Readonly<Record<string, string>>
  | ReadonlyArray<HeaderTuple>
  | HeadersLike; // structural: real Headers satisfies this
