/**
 * @file src/core/parse-utils.ts
 * @module core/parse-utils
 *
 * Core – Parse & Coercion utilities
 * ---------------------------------
 * Helpers that complement Zod parsing and common request-value coercions.
 */

import { z } from "zod";

/**
 * Safe parse wrapper that returns typed data and a compact error summary.
 */
export function safeParseRequest<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; error: z.ZodError; message: string } {
  const res = schema.safeParse(input);
  if (res.success) return { ok: true, data: res.data };
  const message = explainZodError(res.error, { compact: true });
  return { ok: false, error: res.error, message };
}

/**
 * Human-friendly Zod error formatter (Zod v4-compatible).
 * Uses string-literal `issue.code` and guarded property access.
 */
export function explainZodError(error: z.ZodError, opts?: { compact?: boolean }): string {
  const lines: string[] = [];

  const has = <K extends PropertyKey>(obj: object, key: K): obj is Record<K, unknown> =>
    Object.prototype.hasOwnProperty.call(obj, key);

  for (const issue of error.issues) {
    const path = issue.path.length ? issue.path.join(".") : "(root)";
    lines.push(`${path}: ${issue.message}`);
    if (opts?.compact) continue;

    switch (issue.code) {
      case "invalid_type": {
        const expected = has(issue, "expected") ? String(issue.expected) : undefined;
        const received = has(issue, "received") ? String(issue.received) : undefined;
        if (expected) lines.push(`  expected: ${expected}`);
        /* c8 ignore next -- 'received' is optional across Zod versions */
        if (received) lines.push(`  received: ${received}`);
        break;
      }

      case "unrecognized_keys": {
        const keys = has(issue, "keys") && Array.isArray(issue.keys) ? issue.keys : [];
        if (keys.length) lines.push(`  unrecognized keys: ${keys.join(", ")}`);
        break;
      }

      case "invalid_union": {
        const count = has(issue, "errors") && Array.isArray(issue.errors) ? issue.errors.length : 0;
        lines.push(`  union variants failed: ${count}`);
        break;
      }

      case "too_small": {
        const min = has(issue, "minimum") ? String(issue.minimum) : undefined;
        const inclusive =
          has(issue, "inclusive") && (issue.inclusive as boolean) ? " (inclusive)" : "";
        const t = has(issue, "type") ? String(issue.type) : undefined;
        if (min) lines.push(`  minimum: ${min}${inclusive}`);
        /* c8 ignore next -- Zod may omit 'type' on size issues */
        if (t) lines.push(`  type: ${t}`);
        break;
      }

      case "too_big": {
        const max = has(issue, "maximum") ? String(issue.maximum) : undefined;
        const inclusive =
          has(issue, "inclusive") && (issue.inclusive as boolean) ? " (inclusive)" : "";
        const t = has(issue, "type") ? String(issue.type) : undefined;
        if (max) lines.push(`  maximum: ${max}${inclusive}`);
        /* c8 ignore next -- Zod may omit 'type' on size issues */
        if (t) lines.push(`  type: ${t}`);
        break;
      }

      case "invalid_value": {
        const values = has(issue, "values") && Array.isArray(issue.values) ? issue.values : [];
        if (values.length)
          lines.push(`  expected one of: ${values.map((v) => JSON.stringify(v)).join(", ")}`);
        break;
      }

      case "invalid_key": {
        const key = has(issue, "key") ? String(issue.key) : undefined;
        const expected = has(issue, "expected") ? String(issue.expected) : undefined;
        /* c8 ignore next -- 'key' detail is optional */
        if (key) lines.push(`  key: ${key}`);
        /* c8 ignore next -- optional in some versions */
        if (expected) lines.push(`  expected: ${expected}`);
        break;
      }

      case "invalid_element": {
        const index = has(issue, "index") ? String(issue.index) : undefined;
        /* c8 ignore next -- 'index' is not consistently exposed */
        if (index) lines.push(`  index: ${index}`);
        break;
      }

      case "invalid_format": {
        const expected = has(issue, "expected") ? String(issue.expected) : undefined;
        /* c8 ignore next -- optional structured detail */
        if (expected) lines.push(`  expected format: ${expected}`);
        break;
      }

      case "not_multiple_of": {
        const multipleOf = has(issue, "multipleOf") ? String(issue.multipleOf) : undefined;
        /* c8 ignore next -- optional structured detail */
        if (multipleOf) lines.push(`  multipleOf: ${multipleOf}`);
        break;
      }

      case "custom":
      default:
        // no extra structured fields to print by default
        break;
    }
  }

  return lines.join("\n");
}

/** Coerce input to **unix seconds** (number). Accepts Date, number, or string. */
export function toUnixSeconds(input: Date | number | string): number {
  if (input instanceof Date) return Math.floor(input.getTime() / 1000);
  if (typeof input === "number") return Math.floor(input);
  // string: try parse number, else Date.parse
  const trimmed = input.trim();
  const asNum = Number(trimmed);
  if (Number.isFinite(asNum)) return Math.floor(asNum);
  const ms = Date.parse(trimmed);
  if (Number.isFinite(ms)) return Math.floor(ms / 1000);
  throw new TypeError(`toUnixSeconds: cannot parse "${input}"`);
}

/** Format as dd-mm-yyyy for /coins/{id}/history. Accepts Date or string parseable by Date. */
export function ddmmyyyy(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) throw new TypeError(`ddmmyyyy: invalid date "${String(input)}"`);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Normalize a coin id string (lowercase, trimmed). */
export function normalizeCoinId(input: string): string {
  return input.trim().toLowerCase();
}

/** Normalize vs_currencies inputs to a sorted, deduped array of lowercase codes. */
export function normalizeVsCurrencies(input: string[] | string): string[] {
  const arr = Array.isArray(input) ? input : input.split(",");
  const cleaned = arr.map((s) => s.trim().toLowerCase()).filter((s) => s.length > 0);
  return Array.from(new Set(cleaned)).sort();
}
/** Creates a new Zod Error message from a minimal issue object */
export function getZodErrorMsgFrom(issue: Record<string, unknown>): string {
  // @ts-expect-error test-only: constructing minimal issue objects for coverage
  const err = new z.ZodError([issue]);
  return explainZodError(err);
}
