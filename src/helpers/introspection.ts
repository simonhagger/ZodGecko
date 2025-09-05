/**
 * @file src/helpers/introspection.ts
 * @summary Runtime-safe schema introspection utilities (Zod-duck-typed).
 *
 * These helpers work with Zod-like objects **without importing Zod**. They are
 * used both by code generation and runtime helpers to derive defaults and
 * shapes in a tolerant, side-effect-free way.
  * @module helpers/introspection
 */

import type { QMeta, UnwrapDefaultsResult } from "../types.js";

// ---------------------------------------------------------------------------
// Basic guards & utilities
// ---------------------------------------------------------------------------

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function hasOwnKey(obj: unknown, key: PropertyKey): boolean {
  return isObject(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

/** Get an internal Zod-like definition object (if present). */
export function getDef(s: unknown): Record<string, unknown> | undefined {
  if (!isObject(s)) return undefined;

  const def1 = Reflect.get(s as object, "_def") as unknown;
  if (isObject(def1)) return def1;

  const def2 = Reflect.get(s as object, "def") as unknown;
  if (isObject(def2)) return def2;

  return undefined;
}

function getCtorName(s: unknown): string | undefined {
  if (!isObject(s)) return undefined;
  const ctor = (s as { constructor?: { name?: unknown } }).constructor;
  return typeof ctor?.name === "string" ? ctor.name : undefined;
}

/**
 * Best-effort type name for Zod-like nodes. Prefers `_def.typeName`, else falls
 * back to a constructor beginning with `Zod`.
 */
export function getTypeName(s: unknown): string | undefined {
  const d = getDef(s);
  const tnVal = d ? (Reflect.get(d as object, "typeName") as unknown) : undefined;
  if (typeof tnVal === "string") return tnVal;
  const ctor = getCtorName(s);
  return ctor && ctor.startsWith("Zod") ? ctor : undefined;
}

// ---------------------------------------------------------------------------
// Optional/metadata helpers
// ---------------------------------------------------------------------------

/**
 * Read optional query metadata attached to a schema via a well-known symbol.
 * Returns `null` when absent or malformed.
 */
export function getQMeta(schema: unknown): QMeta | null {
  if (!isObject(schema)) return null;
  const key = Symbol.for("zodgecko.qmeta");
  const raw = Reflect.get(schema as object, key) as unknown;
  if (!isObject(raw)) return null;

  const out: { arrayEncoding?: "csv"; dropWhenDefault?: boolean } = {};
  const enc = Reflect.get(raw as object, "arrayEncoding") as unknown;
  if (enc === "csv") out.arrayEncoding = "csv";
  const dwd = Reflect.get(raw as object, "dropWhenDefault") as unknown;
  if (typeof dwd === "boolean" && dwd === false) out.dropWhenDefault = false;
  return Object.keys(out).length > 0 ? (out as QMeta) : null;
}

/** Type guard for objects that expose a `safeParse` function. */
function hasSafeParse(x: unknown): x is { safeParse: (val: unknown) => unknown } {
  return (
    isObject(x) &&
    "safeParse" in x &&
    typeof (x as { safeParse?: unknown }).safeParse === "function"
  );
}

/** Heuristic: does `schema.safeParse(undefined)` succeed? */
export function isOptionalish(schema: unknown): boolean {
  if (!hasSafeParse(schema)) return false;
  try {
    const res = schema.safeParse(undefined);
    return isObject(res) && "success" in res && (res as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Unwrapping for defaults / shapes
// ---------------------------------------------------------------------------

/**
 * Handle chained wrappers (Default / Optional / Effects / Branded) and surface
 * the first default discovered while unwrapping.
 */
export function unwrapForDefaultsDeep(s: unknown): UnwrapDefaultsResult {
  let node: unknown = s;
  let defaultValue: unknown;
  let wasOptional = false;

  for (let i = 0; i < 16; i += 1) {
    const t = getTypeName(node);
    const d = getDef(node);

    // capture default if present at this level
    let dv: unknown;
    if (d && hasOwnKey(d, "defaultValue")) {
      dv = Reflect.get(d as object, "defaultValue");
      if (dv !== undefined) {
        defaultValue = typeof dv === "function" ? (dv as () => unknown)() : dv;
      }
    }

    // wrappers that imply optional-ish semantics
    if (t === "ZodOptional" || t === "ZodNullable" || t === "ZodNullish") {
      wasOptional = true;
    }

    // unions including undefined also imply optional-ish
    let opts: unknown;
    if (d && hasOwnKey(d, "options")) {
      opts = Reflect.get(d as object, "options");
    }
    if ((t === "ZodUnion" || t === "ZodDiscriminatedUnion") && Array.isArray(opts)) {
      if ((opts as unknown[]).some((o) => getTypeName(o) === "ZodUndefined")) wasOptional = true;
    }

    // unwrap known wrappers
    if (t === "ZodDefault" || typeof dv !== "undefined") {
      const inner = d ? (Reflect.get(d as object, "innerType") as unknown) : undefined;
      const schema = d ? (Reflect.get(d as object, "schema") as unknown) : undefined;
      const type = d ? (Reflect.get(d as object, "type") as unknown) : undefined;
      node = inner ?? schema ?? type ?? node;
      continue;
    }
    if (t === "ZodOptional" || t === "ZodNullable" || t === "ZodNullish") {
      const inner = d ? (Reflect.get(d as object, "innerType") as unknown) : undefined;
      node = inner ?? node;
      continue;
    }
    if (t === "ZodEffects") {
      const schema = d ? (Reflect.get(d as object, "schema") as unknown) : undefined;
      node = schema ?? node;
      continue;
    }
    if (t === "ZodBranded") {
      const type = d ? (Reflect.get(d as object, "type") as unknown) : undefined;
      node = type ?? node;
      continue;
    }

    // last resort: generic inner pointers if present
    if (!t && d && (hasOwnKey(d, "innerType") || hasOwnKey(d, "schema") || hasOwnKey(d, "type"))) {
      const inner = Reflect.get(d as object, "innerType") as unknown;
      const schema = Reflect.get(d as object, "schema") as unknown;
      const type = Reflect.get(d as object, "type") as unknown;
      node = inner ?? schema ?? type ?? node;
      continue;
    }

    break;
  }

  const isArray = getTypeName(node) === "ZodArray";
  return { inner: node, defaultValue, wasOptional, isArray };
}

/** Unwrap until a ZodObject or give up (returns the last node seen). */
export function unwrapObjectForShapeDeep(s: unknown): unknown {
  let node: unknown = s;
  for (let i = 0; i < 12; i += 1) {
    const t = getTypeName(node);
    if (t === "ZodObject") return node;
    const d = getDef(node);
    if (t === "ZodDefault" || t === "ZodOptional") {
      const inner = d ? (Reflect.get(d as object, "innerType") as unknown) : undefined;
      node = inner ?? node;
      continue;
    }
    if (t === "ZodEffects") {
      const schema = d ? (Reflect.get(d as object, "schema") as unknown) : undefined;
      node = schema ?? node;
      continue;
    }
    if (t === "ZodBranded") {
      const type = d ? (Reflect.get(d as object, "type") as unknown) : undefined;
      node = type ?? node;
      continue;
    }
    // generic fallbacks
    if (!t && d) {
      const inner = Reflect.get(d as object, "innerType") as unknown;
      const schema = Reflect.get(d as object, "schema") as unknown;
      const type = Reflect.get(d as object, "type") as unknown;
      const next = inner ?? schema ?? type;
      if (next && next !== node) {
        node = next;
        continue;
      }
    }
    break;
  }
  return node;
}

function shapeFromCandidate(candidate: unknown): Record<string, unknown> | null {
  if (typeof candidate === "function") {
    try {
      const res = (candidate as () => Record<string, unknown>)();
      return isObject(res) ? res : null;
    } catch {
      return null;
    }
  }
  return isObject(candidate) ? candidate : null;
}

/** Accepts either a ZodObject or a wrapper around it. */
export function getObjectShape(s: unknown): Record<string, unknown> | null {
  const root = unwrapObjectForShapeDeep(s);
  if (getTypeName(root) !== "ZodObject") return null;

  const d = getDef(root);
  const fromDef = d ? (Reflect.get(d as object, "shape") as unknown) : undefined;
  const fromRoot = Reflect.get(root as object, "shape") as unknown;
  const candidate = typeof fromDef !== "undefined" ? fromDef : fromRoot;
  return shapeFromCandidate(candidate);
}
