/**
 * @file src/helpers/parse-request.ts
 * @module helpers/parse-request
 * @summary Parse Request.
 */
// src/helpers/parse-request.ts

import { getPathInfo, getQueryRules } from "../registry/index.js";
import type { QueryValue, RequestShape } from "../types.js";

/** Treat undefined/null/blank-string as "missing" for required checks. */
function isBlank(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  return false;
}

/**
 * Validate and normalize a request for a given endpoint.
 * - Throws if endpoint is unknown
 * - Throws if required path/query keys are missing/blank
 * - Returns a shallow-normalized shape (no default filling here)
 */
export function parseRequest(endpointPath: string, input: Readonly<RequestShape>): RequestShape {
  const pathInfo = getPathInfo(endpointPath);
  const rules = getQueryRules(endpointPath) ?? [];

  // Unknown endpoint: neither path info nor query rules exist
  if (!pathInfo && rules.length === 0) {
    throw new Error(`Unknown endpoint id: ${endpointPath}`);
  }

  // Path validation
  if (pathInfo && pathInfo.requiredPath.length > 0) {
    const p = input.path ?? {};
    for (const key of pathInfo.requiredPath) {
      const val = (p as Record<string, unknown>)[key];
      if (isBlank(val)) {
        throw new Error(`Missing required path param: ${key}`);
      }
    }
  }

  // Required query validation (derive from rules)
  const requiredQueryKeys = rules
    .filter((r) => (r as { required?: boolean }).required === true)
    .map((r) => r.key);

  if (requiredQueryKeys.length > 0) {
    const q = input.query ?? {};
    for (const key of requiredQueryKeys) {
      const val = (q as Record<string, unknown>)[key];
      if (isBlank(val)) {
        throw new Error(`Missing required query param: ${key}`);
      }
    }
  }

  // Normalize: pass-through but ensure objects exist
  const path = { ...(input.path ?? {}) } as Readonly<Record<string, string>>;
  const query = { ...(input.query ?? {}) } as Readonly<Record<string, QueryValue>>;

  return { path, query };
}
