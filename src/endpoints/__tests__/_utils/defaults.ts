// src/endpoints/__tests__/_utils/defaults.ts
import { normalizeForExpectation } from "./normalize.js";

/** Convert raw defaults to string map (drop non-serializable/empty values). */
export function toStringDefaultsMap(
  d: Readonly<Record<string, unknown>>,
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) {
    const s = normalizeForExpectation(v);
    if (s !== undefined) out[k] = s;
  }
  return Object.freeze(out);
}

/**
 * Keys in `input` whose normalized string differs from `defaultsMap`.
 * Also include keys which are required and have **no** default entry.
 */
export function diffNonDefaultKeys(
  defaultsMap: Readonly<Record<string, string>>,
  input: Record<string, unknown>,
  requiredKeys: readonly string[],
  exclude: ReadonlySet<string> = new Set(),
): string[] {
  const keep = new Set<string>();
  const required = new Set(requiredKeys);

  for (const [k, raw] of Object.entries(input)) {
    if (exclude.has(k)) continue;
    const vStr = normalizeForExpectation(raw);
    if (vStr === undefined) continue;
    const dStr = defaultsMap[k]; // may be undefined
    if (required.has(k) && dStr === undefined) keep.add(k);
    else if (vStr !== dStr) keep.add(k);
  }
  return Array.from(keep);
}
