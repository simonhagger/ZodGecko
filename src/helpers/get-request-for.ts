// src/helpers/get-request-for.ts

import { getPathInfo, getQueryRules, getServerDefaults } from "../registry/index.js";
import type { QueryPrimitive } from "../types/api.js";

/** Options shaping how the request object is generated. */
type GetRequestForOptions = Readonly<{
  includeUndefinedOptionals?: boolean;
  fillServerDefaults?: boolean;
  /** If true, drop any fields that equal their server default (query only). */
  omitDefaultedFields?: boolean;
}>;

/** Return shape for discoverable request surface (includes optional pathTemplate). */
type RequestSurface = Readonly<{
  pathTemplate?: string;
  path: Readonly<Record<string, string>>;
  query: Readonly<Record<string, QueryValue>>;
}>;

type QueryValue = QueryPrimitive | readonly QueryPrimitive[];

/* --------------------------- helpers (no any) --------------------------- */

function isQueryScalar(v: unknown): v is QueryPrimitive {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function isQueryArray(v: unknown): v is readonly QueryPrimitive[] {
  return Array.isArray(v) && v.every(isQueryScalar);
}

function deepEqualQueryValue(a: QueryValue, b: unknown): boolean {
  if (isQueryArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== (b as unknown[])[i]) return false;
    }
    return true;
  }
  return isQueryScalar(b) ? a === b : false;
}

/** Decide if a key should use an array placeholder. */
function shouldUseArrayPlaceholder(
  key: string,
  ruleHasArrayEncoding: boolean,
  serverDefaults: Readonly<Record<string, unknown>>,
): boolean {
  if (ruleHasArrayEncoding) return true;
  const dv = serverDefaults[key];
  return Array.isArray(dv);
}

/* ------------------------------ main API ------------------------------- */

/** Build a discoverable request object for an endpoint from the registry. */
export function getRequestFor(endpointId: string, opts?: GetRequestForOptions): RequestSurface {
  const options = {
    includeUndefinedOptionals: true,
    fillServerDefaults: true,
    omitDefaultedFields: false,
    ...opts,
  };

  const pathInfo = getPathInfo(endpointId);
  const rules = getQueryRules(endpointId) ?? [];
  const defaults = getServerDefaults(endpointId) ?? {};

  // Path: include all required path params as empty strings for discoverability
  const path: Record<string, string> = {};
  if (pathInfo) {
    for (const k of pathInfo.requiredPath) {
      path[k] = "";
    }
  }

  // Query: 1) lay down defaults (server + rule defaults), 2) add placeholders, 3) optionally prune
  const query: Record<string, QueryValue> = {};

  if (options.fillServerDefaults) {
    // 1a) serverDefaults first
    for (const [k, v] of Object.entries(defaults)) {
      if (isQueryArray(v)) {
        query[k] = [...v] as readonly QueryPrimitive[];
      } else if (isQueryScalar(v)) {
        query[k] = v;
      }
    }

    // 1b) then rules that declare a `default`, but only if not already set
    for (const r of rules) {
      const maybeDefault = (r as { default?: unknown }).default;
      if (maybeDefault === undefined) continue;
      if (Object.prototype.hasOwnProperty.call(query, r.key)) continue;

      const v = maybeDefault;
      if (isQueryArray(v)) {
        query[r.key] = [...v] as readonly QueryPrimitive[];
      } else if (isQueryScalar(v)) {
        query[r.key] = v;
      }
      // Non-scalar/array defaults are ignored (not expected in our schemas)
    }
  }

  // 2) Add placeholders for any keys not set yet (for discoverability)
  if (options.includeUndefinedOptionals) {
    for (const r of rules) {
      const k = r.key;
      if (Object.prototype.hasOwnProperty.call(query, k)) continue;

      const useArray = shouldUseArrayPlaceholder(k, Boolean(r.arrayEncoding), defaults);
      query[k] = useArray ? ([] as readonly QueryPrimitive[]) : "";
    }
  }

  // 3) If requested, prune values that exactly equal the server defaults
  if (options.omitDefaultedFields && options.fillServerDefaults) {
    for (const [k, dv] of Object.entries(defaults)) {
      if (Object.prototype.hasOwnProperty.call(query, k) && deepEqualQueryValue(query[k], dv)) {
        delete query[k];
      }
    }
  }

  return {
    pathTemplate: pathInfo?.pathTemplate,
    path,
    query,
  };
}
