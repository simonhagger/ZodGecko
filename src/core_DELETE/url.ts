/**
 * @file src/core/url.ts
 * @module core/url
 *
 * @summary Core – URL helpers (pure)
 * Utilities for building URL paths safely and predictably.
 *
 * Design goals:
 * - Pure, framework-agnostic.
 * - Deterministic output (stable encoding & collapsing).
 * - Friendly ergonomics:
 *    - `formatPath`       → soft, best-effort, never throws.
 *    - `formatPathSafe`   → Result object with structured issues.
 *    - `formatPathStrict` → returns Error on issues (no throw) for easy testing.
 * - Clear error reporting via structured issues.
 */

// ---------- Inline types ----------

type EmptyParams = Record<never, never>;

/** Allowed runtime value types for path params. */
type PathParamScalar = string | number | boolean | bigint | Date;

/** Optional override for unusual encodings. Must return RAW (unencoded) text. */
type PathParamEncoder = (value: unknown, key: string) => string | undefined;

/** Mode determines how issues are handled. */
type FormatPathMode = "strict" | "safe" | "soft";

/** Behavior for missing/invalid tokens in "soft" mode. */
type OnMissingBehavior = "keep-token" | "drop-segment" | "empty";

/** Structured issue reporting (never thrown in "safe"/"soft"). */
type FormatPathIssueKind =
  | "missing" // undefined / null / unresolved token
  | "empty" // becomes empty after trimming/encoding
  | "invalid-type" // array / plain object / symbol / function
  | "invalid-number" // NaN / Infinity
  | "invalid-date" // Date with NaN time
  | "unsupported"; // encoder threw, or other unexpected problems

type FormatPathIssue = {
  kind: FormatPathIssueKind;
  key: string;
  value: unknown;
  message: string;
};

/** Result type for formatPathSafe. */
type FormatPathResult =
  | { ok: true; path: string; issues: []; value: string }
  | { ok: false; issues: FormatPathIssue[] };

/** Options for all formatters. */
type FormatPathOptions = {
  encode?: PathParamEncoder;
  mode?: FormatPathMode; // default: "safe" (formatPathSafe), "soft" (formatPath)
  onMissing?: OnMissingBehavior; // default: "drop-segment" (soft)
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

// ---------- Token helpers ----------

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

// ---------- Low-level pure helpers (small, atomic) ----------

/** Encode a raw (already-trimmed) text segment for safe inclusion in a path. */
function encodeSegment(raw: string): string {
  return encodeURIComponent(raw);
}

/** Collapse duplicate slashes in a path while preserving protocol separators like "http://". */
function collapseDuplicateSlashesPreserveProtocol(path: string): string {
  // Replace runs of slashes not immediately following a colon (avoid "http://")
  return path.replace(/([^:])\/{2,}/g, "$1/");
}

/** Build a reusable issue object. */
function makeIssue(
  kind: FormatPathIssueKind,
  key: string,
  value: unknown,
  message: string,
): FormatPathIssue {
  return { kind, key, value, message };
}

/**
 * Apply a user encoder if provided. The encoder must return RAW text (unencoded).
 * - returns { seg } on success (after URL-encoding)
 * - returns { issue } if returns undefined/empty, or if it throws
 */
function applyEncoder(
  value: unknown,
  key: string,
  encoder?: PathParamEncoder,
): { seg?: string; issue?: FormatPathIssue } {
  if (!encoder) return {};
  try {
    const raw = encoder(value, key);
    if (raw === undefined) {
      return {
        issue: makeIssue("empty", key, value, `Custom encoder returned undefined for "${key}"`),
      };
    }
    const s = raw.trim();
    if (s.length === 0) {
      return {
        issue: makeIssue("empty", key, value, `Custom encoder returned empty for "${key}"`),
      };
    }
    return { seg: encodeSegment(s) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Encoder threw";
    return { issue: makeIssue("unsupported", key, value, msg) };
  }
}

/**
 * Normalize a single non-null, non-undefined param value to a path segment
 * using built-in rules (no custom encoder). Returns { seg } OR { issue }.
 *
 * NOTE: `undefined`/`null` are handled by the caller and never reach here.
 */
function normalizePrimitiveToSegment(
  value: Exclude<PathParamScalar, never>,
  key: string,
): { seg?: string; issue?: FormatPathIssue } {
  // Arrays/objects (non-Date) are rejected at the call site; keep only primitive switches here.
  switch (typeof value) {
    case "string": {
      const s = value.trim();
      if (s.length === 0)
        return { issue: makeIssue("empty", key, value, `Param "${key}" is empty`) };
      return { seg: encodeSegment(s) };
    }
    case "number":
      if (!Number.isFinite(value)) {
        return {
          issue: makeIssue("invalid-number", key, value, `Param "${key}" must be a finite number`),
        };
      }
      return { seg: encodeSegment(String(value)) };
    case "boolean":
      return { seg: encodeSegment(value ? "true" : "false") };
    case "bigint":
      return { seg: encodeSegment(value.toString()) };
    case "object": {
      // Only Date can reach here (others were rejected earlier)
      const d = value;
      if (Number.isNaN(d.getTime())) {
        return {
          issue: makeIssue("invalid-date", key, value, `Param "${key}" is an invalid Date`),
        };
      }
      return { seg: encodeSegment(d.toISOString()) };
    }
    case "symbol":
    case "function":
      return {
        issue: makeIssue("invalid-type", key, value, `Param "${key}" cannot be ${typeof value}`),
      };
    default:
      // "undefined" cannot reach here (caller guards it). Keep a defensive issue anyway.
      /* istanbul ignore next: guarded by caller (null/undefined are handled before) */
      return { issue: makeIssue("missing", key, value, `Param "${key}" is missing`) };
  }
}

/**
 * Produce a replacement string for a token depending on mode.
 * In "soft" mode, we patch the path; in "safe"/"strict", the caller inspects issues.
 */
function substituteToken(
  tokenKey: string,
  mode: FormatPathMode,
  onMissing: OnMissingBehavior,
): string {
  if (mode === "strict" || mode === "safe") return "";
  switch (onMissing) {
    case "keep-token":
      return `{${tokenKey}}`;
    case "empty":
      return "";
    case "drop-segment":
    default:
      return "";
  }
}

// ---------- Public formatters ----------

/**
 * Non-throwing formatter that returns a discriminated Result.
 * - mode "safe"  (default): never throws; { ok:false, issues } if any problem.
 * - mode "strict": like "safe" but you can wrap it to return/throw Error if you want.
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

  let out: string = template.replace(/\{([^}]+)\}/g, (_m: string, rawKey: string): string => {
    const key = rawKey.trim();

    // Missing params object
    if (params === undefined || params === null) {
      issues.push(makeIssue("missing", key, params, "Missing params object"));
      return substituteToken(key, mode, onMissing);
    }

    // Look up the value safely
    const record = params as Record<string, unknown>;
    const hasKey = Object.prototype.hasOwnProperty.call(record, key);
    const v = hasKey ? record[key] : undefined;

    // Missing value
    if (v === undefined || v === null) {
      issues.push(makeIssue("missing", key, v, `Missing param "${key}"`));
      return substituteToken(key, mode, onMissing);
    }

    // Reject arrays & non-Date objects early
    if (Array.isArray(v) || (typeof v === "object" && !(v instanceof Date))) {
      issues.push(makeIssue("invalid-type", key, v, `Param "${key}" must be a primitive or Date`));
      return substituteToken(key, mode, onMissing);
    }

    // User encoder (if any)
    const encRes = applyEncoder(v, key, opts.encode);
    if (encRes.issue) {
      issues.push(encRes.issue);
      return substituteToken(key, mode, onMissing);
    }
    if (encRes.seg) return encRes.seg;

    // Built-in normalization
    const normRes = normalizePrimitiveToSegment(v as PathParamScalar, key);
    if (normRes.issue) {
      issues.push(normRes.issue);
      return substituteToken(key, mode, onMissing);
    }
    return normRes.seg ?? "";
  });

  // Any unresolved placeholders left? Report them (useful with keep-token).
  const unresolved = out.match(/\{([^}]+)\}/g) ?? [];
  for (const token of unresolved) {
    const key = token.slice(1, -1).trim();
    issues.push(makeIssue("missing", key, undefined, `Unresolved token ${token}`));
  }

  if (issues.length > 0) {
    if (mode === "soft") {
      // Best-effort: collapse duplicate slashes but preserve protocol, and succeed.
      out = collapseDuplicateSlashesPreserveProtocol(out);
      return { ok: true as const, path: out, issues: [] as [], value: out };
    }
    // safe/strict → return issues
    return { ok: false as const, issues };
  }

  return { ok: true as const, path: out, issues: [] as [], value: out };
}

/**
 * Strict formatter – returns an Error object when there are issues (no throwing).
 */
export function formatPathStrict<T extends string>(
  template: T,
  params: PathParams<T>,
  opts?: Omit<FormatPathOptions, "mode" | "onMissing">,
): string | Error {
  const res = formatPathSafe(template, params, { ...opts, mode: "strict" });
  if (!res.ok) {
    const msg = res.issues.map((i) => `[${i.kind}] ${i.key}: ${i.message}`).join("; ");
    return new Error(`formatPath: ${msg} (template: "${template}")`);
  }
  return res.path;
}

/**
 * Soft formatter – never throws. Best-effort:
 * - Drops/empties invalid tokens according to `onMissing` (default: "drop-segment").
 * - Collapses duplicate slashes (protocol-safe).
 *
 * If you need structured diagnostics, use `formatPathSafe` instead.
 */
export function formatPath<T extends string>(
  template: T,
  params: PathParams<T>,
  opts?: Omit<FormatPathOptions, "mode">,
): string | Error {
  const res = formatPathSafe(template, params, {
    mode: "soft",
    onMissing: "drop-segment",
    ...opts,
  });
  // In this design, soft mode always returns ok:true; just normalize trailing slashes here.
  const normalized = res.ok
    ? res.path.replace(/\/+$/g, "")
    : res.issues.map((i) => `[${i.kind}] ${i.key}: ${i.message}`).join("; "); // Defensive (should not happen)
  return normalized;
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
  if (isAbsoluteUrl(path)) return path;
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
