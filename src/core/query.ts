/**
 * @file src/core/query.ts
 * @module core/query
 *
 * Pure query-string serialization utilities.
 *
 * Responsibilities (core-safe):
 *  - Alphabetize keys for deterministic cache keys
 *  - Normalize values to strings using consistent rules
 *  - Handle arrays (stable, de-duped; "repeat" | "comma" | "bracket" modes)
 *  - Optionally drop null/undefined; always drop empty/invalid values
 *  - ⚠️ Do NOT consult server defaults (runtime concern)
 */

export type QueryInput = Record<string, unknown>;

export type QueryEncodeOptions = {
  array?: "repeat" | "comma" | "bracket";
  encode?: (value: unknown) => string; // e.g., Dates → ISO
  skipNull?: boolean;
  skipUndefined?: boolean;
};

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];

/** Normalize a single primitive into a query-safe string, or `undefined` to drop. */
export function normalizePrimitive(v: QueryPrimitive): string | undefined {
  if (v === undefined || v === null) return undefined;
  switch (typeof v) {
    case "string": {
      const trimmed = v.trim();
      return trimmed.length ? trimmed : undefined;
    }
    case "number":
      return Number.isFinite(v) ? String(v) : undefined;
    case "boolean":
      return v ? "true" : "false";
    default:
      return undefined;
  }
}

/** Apply optional encoder before normalization (keeps this module pure). */
function applyEncode(v: QueryPrimitive, encode?: (value: unknown) => string): QueryPrimitive {
  if (!encode) return v;
  try {
    // If encoder returns a non-empty string, use it; otherwise let normalize drop it.
    const out = encode(v);
    return (typeof out === "string" ? out : String(out)) as QueryPrimitive;
  } catch {
    // Be conservative: if encoder throws, fall back to original value.
    return v;
  }
}

/**
 * Normalize an arbitrary query value (scalar or array) to a **string**.
 * Arrays are de-duped and sorted for stability.
 */
export function normalizeValue(
  value: QueryValue,
  encode?: (value: unknown) => string,
): string | undefined {
  if (Array.isArray(value)) {
    const parts = value
      .map((v) => normalizePrimitive(applyEncode(v, encode)))
      .filter((s): s is string => s !== undefined);

    const csv = Array.from(new Set(parts)).sort().join(",");
    return csv.length ? csv : undefined;
  }
  return normalizePrimitive(applyEncode(value, encode));
}

/**
 * Return a flat, stable list of [key, value] pairs according to the policy.
 * No URLSearchParams here—pure data.
 */
export function normalizeQuery(obj: QueryInput, opts?: QueryEncodeOptions): [string, string][] {
  const arrayMode = opts?.array ?? "comma";
  const skipNull = opts?.skipNull ?? true;
  const skipUndefined = opts?.skipUndefined ?? true;
  const encode = opts?.encode;

  const out: [string, string][] = [];
  const keys = Object.keys(obj).sort(); // deterministic order

  for (const key of keys) {
    const raw = obj[key];

    // Respect skip flags early for scalars and arrays.
    if (raw === undefined && skipUndefined) continue;
    if (raw === null && skipNull) continue;

    if (Array.isArray(raw)) {
      // Normalize each element, then de-dup + sort for stability.
      const parts = raw
        .map((v) => normalizePrimitive(applyEncode(v as QueryPrimitive, encode)))
        .filter((s): s is string => s !== undefined);

      if (parts.length === 0) continue;

      const uniqueSorted = Array.from(new Set(parts)).sort();

      if (arrayMode === "comma") {
        out.push([key, uniqueSorted.join(",")]);
      } else if (arrayMode === "repeat") {
        for (const v of uniqueSorted) out.push([key, v]);
      } else {
        // "bracket"
        for (const v of uniqueSorted) out.push([`${key}[]`, v]);
      }
      continue;
    }

    // Scalar
    const s = normalizePrimitive(applyEncode(raw as QueryPrimitive, encode));
    if (s !== undefined) out.push([key, s]);
  }

  return out;
}

export function queryString(obj: QueryInput, opts?: QueryEncodeOptions): string {
  const pairs = normalizeQuery(obj, opts);
  return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

export function queryParams(obj: QueryInput, opts?: QueryEncodeOptions): URLSearchParams {
  return new URLSearchParams(normalizeQuery(obj, opts));
}

/** Normalize a server-default-like value using the same core rules (pure). */
export function normalizeDefault(
  v: unknown,
  opts?: Pick<QueryEncodeOptions, "encode">,
): string | undefined {
  return Array.isArray(v)
    ? normalizeValue(v as QueryValue, opts?.encode)
    : normalizePrimitive(applyEncode(v as QueryPrimitive, opts?.encode));
}
