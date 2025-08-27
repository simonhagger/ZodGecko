// src/endpoints/__tests__/_utils/normalize.ts

/** Convert arbitrary value to the string form our query builder would emit. */
export function normalizeForExpectation(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;

  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : undefined;
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : undefined;
  if (typeof v === "bigint") return v.toString();

  if (Array.isArray(v)) {
    const parts = v.map(normalizeForExpectation).filter((s): s is string => Boolean(s));
    if (parts.length === 0) return undefined;
    const csv = Array.from(new Set(parts)).sort().join(",");
    return csv || undefined;
  }
  return undefined;
}

/** Build expected query by picking named keys from input (drops undefined after normalization). */
export function expectedQueryForKeys(
  input: Record<string, unknown>,
  keys: readonly string[],
  exclude: ReadonlySet<string> = new Set(),
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    if (exclude.has(k)) continue;
    const v = normalizeForExpectation(input[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}
