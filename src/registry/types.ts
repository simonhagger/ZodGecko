import type { QueryPrimitive, VersionPlanPair } from "../types/api.js";

/** Encoding policy for array-like query params. MVP: "csv" only; extensible later. */
export type ArrayEncoding = "csv";

/** Minimal Zod-like shape (no runtime dep on zod) */
export type ZodLikeSchema = Readonly<{ parse: (x: unknown) => unknown }>;

/** Declarative rule for a single query parameter. */
export type QueryRule = Readonly<{
  key: string;
  /** If present, this is the server default value (single source of truth). */
  default?: QueryPrimitive | ReadonlyArray<QueryPrimitive>;
  /** Whether to drop the param from the query string when it equals its default. Default: true. */
  dropWhenDefault?: boolean;
  /** Array serialization policy (MVP: csv). */
  arrayEncoding?: ArrayEncoding;
  required?: true;
}>;

/** HTTP methods we may need (most CG endpoints are GET). */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Minimal validator interface; can be backed by Zod internally later. */
export type Schema<T> = Readonly<{
  parse: (value: unknown) => T;
}>;

/** A single endpoint definition in the registry. */
export type RegistryEndpoint<Req = unknown, Res = unknown> = Readonly<{
  /** Dot + `by-<param>` slug, e.g. "coins.by-id.history". */
  id: string;

  /** Valid version/plan pair (enforced by VersionPlanPair). */
  validFor: VersionPlanPair;

  /** HTTP method (usually GET). */
  method: HttpMethod;

  /** API path template, e.g. "/coins/{id}/history". */
  pathTemplate: string;

  /** Required path param names (e.g., ["id", "contract_address"]). */
  requiredPath: ReadonlyArray<string>;

  /** Required query param names (e.g., ["ids", "vs_currency"]). */
  requiredQuery: ReadonlyArray<string>;

  /** Declarative query rules (defaults + drop policy + encoding). */
  queryRules: ReadonlyArray<QueryRule>;

  /** Single source of truth (derived): a raw map of server defaults. */
  serverDefaults: Readonly<Record<string, QueryPrimitive | ReadonlyArray<QueryPrimitive>>>;

  /** Optional request validator (pluggable later). */
  requestSchema?: Schema<Req>;
  /** Optional response validator (pluggable later). */
  responseSchema?: Schema<Res>;
}>;
