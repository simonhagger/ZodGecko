/**
 * @file src/helpers/format-params.ts
 * @module helpers/format-params
 * @summary Format Params.
 */
// src/helpers/format-params.ts
import { getQueryRules, getServerDefaults } from "../registry/index.js";
import type { QueryPrimitive } from "../types.js";

type QueryValue = QueryPrimitive | ReadonlyArray<QueryPrimitive>;
type QueryInput = Readonly<Record<string, QueryValue>>;

function atomToString(x: QueryPrimitive): string | null {
  if (typeof x === "boolean") return x ? "true" : "false";
  if (typeof x === "number") return Number.isFinite(x) ? String(x) : null;
  // string
  return x;
}

function arrayToCsv(values: ReadonlyArray<QueryPrimitive>): string {
  const atoms = values.map((v) => atomToString(v)).filter((v): v is string => v !== null);

  // dedupe + sort for determinism
  const csv = Array.from(new Set(atoms)).sort().join(",");
  return csv;
}

/** Normalize mixed query inputs to a sorted string map (drops empties/non-finite). */
function normalize(obj: QueryInput): Record<string, string> {
  const out: Record<string, string> = {};

  for (const key of Object.keys(obj)) {
    const v = obj[key];

    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      const csv = arrayToCsv(v);
      if (csv.length > 0) out[key] = csv;
      continue;
    }

    if (typeof v === "boolean") {
      out[key] = v ? "true" : "false";
      continue;
    }

    if (typeof v === "number") {
      if (Number.isFinite(v)) out[key] = String(v);
      continue;
    }

    // string only; drop empty
    if (typeof v === "string" && v.length > 0) {
      out[key] = v;
    }
  }

  // sort keys for determinism
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Core variant: registry-agnostic normalization.
 * @param params (required: object)
 * @returns object
 */
export function formatParams(params: QueryInput): Record<string, string> {
  return normalize(params);
}

/**
 * Registry-aware variant: drops params equal to server defaults per rules.
 * @param endpointId (required: string)
 * @param params (required: object)
 * @returns object
 */
export function formatParamsForEndpoint(
  endpointId: string,
  params: QueryInput,
): Record<string, string> {
  const normalized = normalize(params);

  const rules = getQueryRules(endpointId);
  const defaults = getServerDefaults(endpointId);
  if (!rules || !defaults) return normalized;

  // Normalize defaults using the same logic as inputs for apples-to-apples compare.
  const normalizedDefaults: Record<string, string> = {};
  for (const r of rules) {
    const dv = defaults[r.key];
    if (dv === undefined) continue;

    // Build a single-key object to normalize that default value
    const nv = normalize({ [r.key]: dv } as Readonly<Record<string, QueryValue>>);
    const val = nv[r.key];
    if (val !== undefined) {
      normalizedDefaults[r.key] = val;
    }
  }

  // Keep entries when (a) rule disallows dropping, or (b) value != normalized default.
  const outEntries = Object.entries(normalized).filter(([k, v]) => {
    const rule = rules.find((r) => r.key === k);
    const allowDrop = rule ? rule.dropWhenDefault !== false : true;
    return allowDrop ? normalizedDefaults[k] !== v : true;
  });

  return Object.fromEntries(outEntries);
}
