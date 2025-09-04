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
//  Version / Plan (single source of truth) + Registry Config
// ===========================================================================
import type { PLANS, VERSIONS } from "./helpers/constants.js";
import type { GENERATED_REGISTRY as GEN } from "./registry/generated.js";

// ===========================================================================
//  Derived unions from the generated registry (paths/ids per version/plan)
// ===========================================================================

export type GeneratedRegistry = typeof GEN;
export type GeneratedEntry = GeneratedRegistry[number];

/** Narrow entries to those matching a `{ version, plan }` pair using the generated tuple. */
export type EntryFor<V extends VersionPlanPair> = Extract<GeneratedEntry, { readonly validFor: V }>;

/** Union of API path templates valid for a given `{ version, plan }`. */
export type EndpointPathFor<V extends VersionPlanPair> = EntryFor<V>["pathTemplate"];

/** Union of endpoint ids valid for a given `{ version, plan }`. */
export type EndpointIdFor<V extends VersionPlanPair> = EntryFor<V>["id"];

/** Union of all version/plan keys present in the generated registry. */
export type DerivedVersionPlanKey = GeneratedEntry extends {
  readonly validFor: {
    readonly version: infer Ver extends string;
    readonly plan: infer Pl extends string;
  };
}
  ? `${Ver}/${Pl}`
  : never;

/** Union of supported API versions. */
export type ApiVersion = (typeof VERSIONS)[number];

/** Union of supported API plans. */
export type ApiPlan = (typeof PLANS)[number];

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

// ===========================================================================
//  Query string primitives & Request shape
// ===========================================================================

/** Allowed primitive types in query strings. */
export type QueryPrimitive = string | number | boolean;
/** Read‑only array of primitives (CSV‑style encodings). */
export type QueryArray = readonly QueryPrimitive[];
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
/** Minimal Zod-compatible surface (no runtime dependency on zod). */
export type ZodLikeSchema<T = unknown> = Readonly<{
  parse: (value: unknown) => T;
  /** Optional: many places duck-type this in tests/introspection. */
  safeParse?: (value: unknown) => { success: boolean; data?: T; error?: unknown };
  /** Optional internals seen in different zod builds; kept for duck-typing only. */
  _def?: unknown;
  def?: unknown;
}>;

/** Minimal validator interface; can be backed by Zod internally. */
export type Schema<T> = Readonly<{ parse: (value: unknown) => T }>;

/** Declarative rule for a single query parameter. */
export type QueryRule = Readonly<{
  /** Query key (as documented by CoinGecko). */
  key: string;
  /** Server default value (single source of truth) if any. */
  default?: QueryValue;
  /** Drop from querystring when value equals its default. Default: `true`. */
  dropWhenDefault?: boolean;
  /** Array serialization policy (MVP: CSV). */
  arrayEncoding?: ArrayEncoding;
  /** True when the key is mandatory in the querystring. */
  required?: true;
}>;

/** HTTP methods used by the registry (most endpoints are GET). */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

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
  requiredPath: readonly string[];
  /** Required query param names (as strings). */
  requiredQuery: readonly string[];
  /** Declarative query rules (defaults + drop policy + encoding). */
  queryRules: readonly QueryRule[];
  /** Raw map of server defaults (derived). */
  serverDefaults: Readonly<Record<string, QueryValue>>;
  /** Optional request validator (pluggable). */
  requestSchema: Schema<Req>;
  /** Optional response validator (pluggable). */
  responseSchema: Schema<Res>;
}>;

// ===========================================================================
//  Derived unions from the generated registry (paths/ids per version/plan)
// ===========================================================================

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

// /** Narrow entries to those matching a `{ version, plan }` pair. */
// export type MatchByVersionPlan<E, V> = E extends {
//   readonly validFor: { readonly version: VPVersion<V>; readonly plan: VPPlan<V> };
// }
//   ? E
//   : never;

/** Union of *all* path templates present in the registry (any version/plan). */
export type AnyEndpointPath = RegistryEndpoint["pathTemplate"];

/** Union of *all* endpoint ids present in the registry (any version/plan). */
export type AnyEndpointId = RegistryEndpoint["id"];

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
  RegistryEndpoint as RegistryEntry,
};
export type Registry = readonly RegistryEndpoint[];
export type EndpointId = RegistryEndpoint["id"];
export type Version = RegistryEndpoint["validFor"]["version"];
export type Plan = RegistryEndpoint["validFor"]["plan"];

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
  | readonly HeaderTuple[]
  | HeadersLike; // structural: real Headers satisfies this

// ---------------------------------------------------------------------------
// Optional/metadata helpers
// ---------------------------------------------------------------------------

export type QMeta = Readonly<{ arrayEncoding?: "csv"; dropWhenDefault?: boolean }>;

// ---------------------------------------------------------------------------
// Unwrapping for defaults / shapes
// ---------------------------------------------------------------------------

export type UnwrapDefaultsResult = Readonly<{
  inner: unknown;
  defaultValue?: unknown;
  wasOptional: boolean;
  isArray: boolean;
}>;

// ---------------------------------------------------------------------------
// Module Discovery
// ---------------------------------------------------------------------------
/** Discovered Module type */
export type DiscoveredModule = Readonly<{
  slug: string;
  version: ApiVersion;
  plan: ApiPlan;
  /** Absolute path to the `index.ts` entry for this variant. */
  file: string;
}>;
/** Discovered Option type */
export type DiscoverOptions = Readonly<{
  /** Absolute path to your `src/schemas` directory. */
  schemasDir: string;
  /** Optional allowlist of slugs to include. */
  only?: ReadonlySet<string> | string[] | null;
  /**
   * Optional override for file existence checks (useful in tests).
   * Defaults to `fs.access`.
   */
  fsAccess?: (p: string) => Promise<boolean>;
}>;

export type ClientOptions<V extends VersionPlanPair> = Readonly<{
  validFor: V;
  baseURL?: string;
}>;
