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

/** Query input object which is a record keyed by string with an unknown value type. */
export type QueryInput = Record<string, unknown>;

/** Query encoding options.
 * @property array - How to encode arrays (default: "comma").
 * @property encode - Optional custom encoder function.
 * @property skipNull - Whether to skip null values (default: true).
 * @property skipUndefined - Whether to skip undefined values (default: true).
 */
export type QueryEncodeOptions = {
  array?: "repeat" | "comma" | "bracket";
  encode?: (value: unknown) => string; // e.g., Dates → ISO
  skipNull?: boolean;
  skipUndefined?: boolean;
};

/** Query primitive value type.
 * @type string | number | boolean | null | undefined
 */
export type QueryPrimitive = string | number | boolean | null | undefined;

/**
 * Query value type.
 * @type QueryPrimitive | QueryPrimitive[]
 */
export type QueryValue = QueryPrimitive | QueryPrimitive[];

/**
 * Normalize a single primitive into a query-safe string, or `undefined` to drop.
 * @param v The value to normalize.
 * @returns A normalized string representation of the value, or undefined if invalid.
 */
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

/**
 * Apply optional encoder before normalization (keeps this module pure).
 * @param v The value to encode.
 * @param encode Optional encoder function.
 * @returns The encoded value, or the original value if no encoder is provided or it fails.
 */
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
 * Normalize a query value (scalar or array) to a **string**.
 * Arrays are de-duped and sorted for stability.
 * @param value The query value to normalize.
 * @param encode Optional encoder function.
 * @returns A normalized string representation of the value, or undefined if invalid.
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
 * Normalize a query object according to the specified options.
 * @param obj The query object to normalize.
 * @param opts Optional encoding options.
 * @returns A normalized array of [key, value] pairs.
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

/**
 * Convert a query object into a canonical "a=1&b=2" string.
 * @param obj The query object to convert.
 * @param opts Optional encoding options.
 * @returns A canonical query string.
 */
export function queryString(obj: QueryInput, opts?: QueryEncodeOptions): string {
  const pairs = normalizeQuery(obj, opts);
  return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

/**
 * Convert a query object into URLSearchParams.
 * @param obj The query object to convert.
 * @param opts Optional encoding options.
 * @returns A URLSearchParams object representing the query.
 */
export function queryParams(obj: QueryInput, opts?: QueryEncodeOptions): URLSearchParams {
  return new URLSearchParams(normalizeQuery(obj, opts));
}

/**
 * Normalize a default-like value using the same core rules (pure).
 * @param v The value to normalize.
 * @param opts Optional encoding options.
 * @returns A normalized string representation of the value, or undefined if invalid.
 */
export function normalizeDefault(
  v: unknown,
  opts?: Pick<QueryEncodeOptions, "encode">,
): string | undefined {
  return Array.isArray(v)
    ? normalizeValue(v as QueryValue, opts?.encode)
    : normalizePrimitive(applyEncode(v as QueryPrimitive, opts?.encode));
}
