/**
 * @file src/core/url.ts
 * @module core/url
 *
 * Core – URL helpers (pure)
 * -------------------------
 * Utilities for building URL paths safely and predictably.
 *
 * Design goals:
 * - Pure, framework-agnostic (no env, no global config).
 * - Deterministic output (stable ordering, consistent encoding).
 * - Friendly ergonomics:
 *    - `formatPath`  → soft, never throws (best-effort).
 *    - `formatPathSafe` → returns a Result object, never throws.
 *    - `formatPathStrict` → throws on any issue (good for tests/SDK).
 * - Clear error reporting via structured issues.
 *
 * Included helpers:
 * - pathParamKeys(template)                 → ["id", "slug"]
 * - dropPathParamsByTemplate(template, o)   → clone without path keys
 * - formatPath / formatPathSafe / Strict    → fill `{param}` placeholders
 * - joinBaseAndPath(base, path)             → join with exactly one slash
 * - ensureLeadingSlash(path)                → idempotent leading slash
 * - isAbsoluteUrl(u)                        → http/https absolute check
 */

// ---------- Internal (inline) types ----------

type EmptyParams = Record<never, never>;

/** Allowed runtime value types for path params. */
type PathParamScalar = string | number | boolean | bigint | Date;

/** Optional override for unusual encodings. Return raw (UNencoded) text. */
type PathParamEncoder = (value: unknown, key: string) => string | undefined;

/** Mode determines how issues are handled. */
type FormatPathMode = "strict" | "safe" | "soft";

/** Behavior for missing/invalid tokens in "soft" mode. */
type OnMissingBehavior = "keep-token" | "drop-segment" | "empty";

/** Structured issue reporting (never thrown in "safe" / "soft"). */
type FormatPathIssueKind =
  | "missing" // undefined / null
  | "empty" // becomes empty after trimming/encoding
  | "invalid-type" // array / plain object / symbol / function
  | "invalid-number" // NaN / Infinity
  | "invalid-date" // Date with NaN time
  | "unsupported"; // anything else unexpected

type FormatPathIssue = {
  kind: FormatPathIssueKind;
  key: string;
  value: unknown;
  message: string;
};

/** Result type for formatPathSafe. */
type FormatPathResult =
  | { ok: true; path: string; issues: [] }
  | { ok: false; issues: FormatPathIssue[]; path?: string };

/** Options for all formatters. */
type FormatPathOptions = {
  encode?: PathParamEncoder;
  mode?: FormatPathMode; // default: "safe" in formatPathSafe; "soft" in formatPath
  onMissing?: OnMissingBehavior; // default: "drop-segment" in soft mode
};

/**
 * Extract required path-params from a `{param}` template (type-level).
 * Values are restricted to PathParamScalar to catch mistakes at compile time.
 */
export type PathParams<T extends string> = string extends T
  ? Record<string, PathParamScalar>
  : T extends `${string}{${infer P}}${infer R}`
    ? { [K in Trim<P> | keyof PathParams<R>]: PathParamScalar }
    : EmptyParams;

/** Trim helper at the type level to handle "{ id }" tokens. */
type Trim<S extends string> = S extends ` ${infer R}`
  ? Trim<R>
  : S extends `${infer R} `
    ? Trim<R>
    : S;

// ---------- Core helpers ----------

/**
 * Extract `{param}` keys from a template like "/coins/{id}/tickers".
 * Dedupe and `trim()` names to handle "{ id }" gracefully.
 */
export function pathParamKeys(template: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    const k = m[1].trim();
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
  }
  return keys;
}

/**
 * Drop `{param}` keys from an object (non-mutating) based on a template.
 * Useful when callers pass a single object that includes both path and query keys.
 */
export function dropPathParamsByTemplate<T extends Record<string, unknown>>(
  template: string,
  obj: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj };
  for (const k of pathParamKeys(template)) {
    delete out[k];
  }
  return out;
}

// ---------- Formatting internals ----------

/** Convert a single param to a URL-safe segment, or return a structured issue. */
function tryParamToSegment(
  value: unknown,
  key: string,
  encode?: PathParamEncoder,
): { seg?: string; issue?: FormatPathIssue } {
  try {
    // Custom encoder first; must return raw (unencoded) text.
    if (encode) {
      const out = encode(value, key);
      if (out !== undefined) {
        const s = out.trim();
        if (!s) {
          return {
            issue: {
              kind: "empty",
              key,
              value,
              message: `Custom encoder returned empty for "${key}"`,
            },
          };
        }
        return { seg: encodeURIComponent(s) };
      }
      return {
        issue: {
          kind: "empty",
          key,
          value,
          message: `Custom encoder returned undefined for "${key}"`,
        },
      };
    }

    // Reject arrays / plain objects – ambiguous for path segments.
    if (
      Array.isArray(value) ||
      (typeof value === "object" && value !== null && !(value instanceof Date))
    ) {
      return {
        issue: {
          kind: "invalid-type",
          key,
          value,
          message: `Param "${key}" must be a primitive or Date`,
        },
      };
    }

    switch (typeof value) {
      case "string": {
        const s = value.trim();
        if (!s) return { issue: { kind: "empty", key, value, message: `Param "${key}" is empty` } };
        return { seg: encodeURIComponent(s) };
      }
      case "number":
        if (!Number.isFinite(value)) {
          return {
            issue: {
              kind: "invalid-number",
              key,
              value,
              message: `Param "${key}" must be a finite number`,
            },
          };
        }
        return { seg: encodeURIComponent(String(value)) };
      case "boolean":
        return { seg: encodeURIComponent(value ? "true" : "false") };
      case "bigint":
        return { seg: encodeURIComponent(value.toString()) };
      case "undefined":
        return { issue: { kind: "missing", key, value, message: `Param "${key}" is missing` } };
      case "symbol":
      case "function":
        return {
          issue: {
            kind: "invalid-type",
            key,
            value,
            message: `Param "${key}" cannot be ${typeof value}`,
          },
        };
      default:
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            return {
              issue: {
                kind: "invalid-date",
                key,
                value,
                message: `Param "${key}" is an invalid Date`,
              },
            };
          }
          return { seg: encodeURIComponent(value.toISOString()) };
        }
        return {
          issue: {
            kind: "unsupported",
            key,
            value,
            message: `Unsupported param type for "${key}"`,
          },
        };
    }
  } catch (e) {
    return { issue: { kind: "unsupported", key, value, message: (e as Error).message } };
  }
}

/** Substitute logic for soft/safe/strict modes. */
function substituteToken(
  tokenKey: string,
  issue: FormatPathIssue,
  mode: FormatPathMode,
  onMissing: OnMissingBehavior,
): string {
  if (mode === "strict" || mode === "safe") return ""; // placeholder; caller will examine issues
  // "soft" mode: choose how to patch the path
  switch (onMissing) {
    case "keep-token":
      return `{${tokenKey}}`; // useful for debugging
    case "empty":
      return ""; // leaves empty segment, may collapse later
    case "drop-segment":
    default:
      return ""; // best-effort: remove the bad piece
  }
}

// ---------- Public formatters ----------

/**
 * Non-throwing formatter that returns a discriminated Result.
 * - mode "safe" (default): never throws; { ok:false, issues } if any problem.
 * - mode "strict": equivalent to strict checks, but still returns { ok:false } instead of throwing.
 * - mode "soft": best-effort; attempts to produce a path and returns { ok:true, path }.
 */
export function formatPathSafe<T extends string>(
  template: T,
  params: PathParams<T>,
  opts: FormatPathOptions = {},
): FormatPathResult {
  const mode: FormatPathMode = opts.mode ?? "safe";
  const onMissing: OnMissingBehavior = opts.onMissing ?? "drop-segment";
  const issues: FormatPathIssue[] = [];

  let out = template.replace(/\{([^}]+)\}/g, (_m, rawKey: string) => {
    const key = rawKey.trim();
    const v = (params as Record<string, unknown>)[key];

    if (v === undefined || v === null) {
      const issue: FormatPathIssue = {
        kind: "missing",
        key,
        value: v,
        message: `Missing param "${key}"`,
      };
      issues.push(issue);
      return substituteToken(key, issue, mode, onMissing);
    }

    const { seg, issue } = tryParamToSegment(v, key, opts.encode);
    if (issue) {
      issues.push(issue);
      return substituteToken(key, issue, mode, onMissing);
    }
    return seg!; // defined when no issue
  });

  // Any unresolved placeholders left?
  const unresolved = out.match(/\{([^}]+)\}/g) ?? [];
  for (const token of unresolved) {
    const key = token.slice(1, -1).trim();
    issues.push({ kind: "missing", key, value: undefined, message: `Unresolved token ${token}` });
  }

  if (issues.length) {
    if (mode === "strict" || mode === "safe") {
      return { ok: false, issues };
    }
    // mode === "soft": normalize duplicate slashes (avoid touching protocol slashes).
    out = out.replace(/([^:])\/{2,}/g, "$1/");
    return { ok: true, path: out, issues: [] as [] };
  }

  return { ok: true, path: out, issues: [] };
}

/**
 * Strict formatter – throws on any issue (useful for tests/SDK generation).
 */
export function formatPathStrict<T extends string>(
  template: T,
  params: PathParams<T>,
  opts?: Omit<FormatPathOptions, "mode" | "onMissing">,
): string {
  const res = formatPathSafe(template, params, { ...opts, mode: "strict" });
  if (!res.ok) {
    const msg = res.issues.map((i) => `[${i.kind}] ${i.key}: ${i.message}`).join("; ");
    throw new Error(`formatPath: ${msg} (template: "${template}")`);
  }
  return res.path;
}

/**
 * Soft formatter – never throws. Best-effort:
 * - Drops/empties invalid tokens according to `onMissing` (default: "drop-segment").
 * - Collapses duplicate slashes (but preserves protocol).
 *
 * If you need structured diagnostics, use `formatPathSafe` instead.
 */
export function formatPath<T extends string>(
  template: T,
  params: PathParams<T>,
  opts?: Omit<FormatPathOptions, "mode">,
): string {
  const res = formatPathSafe(template, params, {
    mode: "soft",
    onMissing: "drop-segment",
    ...opts,
  });
  // In soft mode we expect ok:true; if not, degrade gracefully.
  return res.ok ? res.path : template.replace(/\{[^}]+\}/g, "");
}

// ---------- Base/path utilities ----------

/**
 * Join `base` + `path` with exactly one slash.
 * - Removes trailing slashes from base
 * - Removes leading slashes from path
 * - Handles empty base or empty path
 * - If `path` is absolute (http/https), returns `path` unchanged.
 */
export function joinBaseAndPath(base: string, path: string): string {
  if (isAbsoluteUrl(path)) return path; // absolute wins
  const baseTrim = base ? base.replace(/\/+$/, "") : "";
  const pathTrim = path ? path.replace(/^\/+/, "") : "";
  if (!baseTrim) return pathTrim;
  if (!pathTrim) return baseTrim;
  return `${baseTrim}/${pathTrim}`;
}

/** Ensure a single leading slash (idempotent). */
export function ensureLeadingSlash(path: string): string {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

/** Lightweight absolute-URL check (http/https). */
export function isAbsoluteUrl(u: string): boolean {
  return /^https?:\/\//i.test(u);
}
