/**
 * @file Core — helpers tests (src/core/helpers.ts)
 * @summary Exhaustive tests for:
 *   - QueryValue, QueryObject (Zod schemas)
 *   - dropParams, dropId (non-mutating removals)
 *   - pick (own+enumerable only)
 *   - stripUndefined (prunes undefined)
 *   - ensureArray (normalizes to array)
 *   - toCsv (filterEmpty/dedupe/sort)
 *   - isObjectRecord (plain-object guard)
 */

import { describe, it, expect } from "vitest";

import {
  QueryValue,
  QueryObject,
  dropParams,
  dropId,
  pick,
  stripUndefined,
  ensureArray,
  toCsv,
  isObjectRecord,
} from "../helpers.js";

/* ------------------------------------------------------------------ */
/* Zod schemas: QueryValue / QueryObject                               */
/* ------------------------------------------------------------------ */

describe("helpers/QueryValue", () => {
  it("accepts string | number | boolean | string[] | undefined", () => {
    expect(QueryValue.safeParse("s").success).toBe(true);
    expect(QueryValue.safeParse(1).success).toBe(true);
    expect(QueryValue.safeParse(true).success).toBe(true);
    expect(QueryValue.safeParse(["a", "b"]).success).toBe(true);
    expect(QueryValue.safeParse(undefined).success).toBe(true);
  });

  it("rejects objects, arrays of non-strings, functions", () => {
    expect(QueryValue.safeParse({}).success).toBe(false);
    expect(QueryValue.safeParse([1, 2] as unknown).success).toBe(false);
    expect(QueryValue.safeParse(() => {}).success).toBe(false);
  });
});

describe("helpers/QueryObject", () => {
  it("accepts arbitrary string keys whose values conform to QueryValue", () => {
    const ok = QueryObject.safeParse({
      a: "x",
      b: 1,
      c: true,
      d: ["p", "q"],
      e: undefined,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects when a value violates QueryValue", () => {
    const bad = QueryObject.safeParse({ a: { nope: true } });
    expect(bad.success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* dropParams / dropId                                                 */
/* ------------------------------------------------------------------ */

describe("helpers/dropParams", () => {
  it("returns a new object with the specified keys removed", () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = dropParams(src, ["a", "c"] as const);
    expect(out).toEqual({ b: 2 });
    expect(src).toEqual({ a: 1, b: 2, c: 3 }); // non-mutating
  });

  it("ignores keys that are not present on the source", () => {
    const src = { a: 1, b: 2 } as const;
    const out = dropParams(src, ["z", "y"] as const); // keys not in src
    expect(out).toEqual(src); // unchanged
  });
});

describe("helpers/dropId", () => {
  it("removes the 'id' key when present", () => {
    const src = { id: "bitcoin", page: 1 };
    const out = dropId(src);
    expect(out).toEqual({ page: 1 });
  });

  it("is safe when 'id' is absent", () => {
    const src = { page: 1 } as const;
    const out = dropId(src);
    expect(out).toEqual({ page: 1 });
  });
});

/* ------------------------------------------------------------------ */
/* pick                                                                */
/* ------------------------------------------------------------------ */

describe("helpers/pick", () => {
  it("picks only own + enumerable properties", () => {
    const proto = { p: 0 }; // non-own on child
    const obj = Object.create(proto) as Record<string, unknown>;
    Object.defineProperty(obj, "hidden", {
      value: 123,
      enumerable: false,
      configurable: true,
    });
    obj.a = 1;
    obj.b = 2;

    const out = pick(obj, ["a", "b", "p", "hidden"]);
    expect(out).toEqual({ a: 1, b: 2 });
  });

  it("ignores keys not present on the source (typing-safe)", () => {
    const src = { a: 1, b: 2 };
    const out = pick(src, ["a", "z" as keyof typeof src]); // keep TS happy
    expect(out).toEqual({ a: 1 });
  });

  it("is non-mutating", () => {
    const src = { a: 1, b: 2 };
    const _ = pick(src, ["a"]);
    expect(src).toEqual({ a: 1, b: 2 });
  });
});

/* ------------------------------------------------------------------ */
/* stripUndefined                                                      */
/* ------------------------------------------------------------------ */

describe("helpers/stripUndefined", () => {
  it("removes only undefined values", () => {
    const out = stripUndefined({ a: 1, b: undefined, c: null, d: false });
    expect(out).toEqual({ a: 1, c: null, d: false });
  });

  it("returns an empty object when all values are undefined", () => {
    const out = stripUndefined({ a: undefined, b: undefined });
    expect(out).toEqual({});
  });

  it("does not mutate the input", () => {
    const src = { a: undefined, b: 1 };
    const out = stripUndefined(src);
    expect(src).toEqual({ a: undefined, b: 1 });
    expect(out).toEqual({ b: 1 });
  });
});

/* ------------------------------------------------------------------ */
/* ensureArray                                                         */
/* ------------------------------------------------------------------ */

describe("helpers/ensureArray", () => {
  it("wraps non-array values into an array", () => {
    expect(ensureArray("x")).toEqual(["x"]);
    expect(ensureArray(1)).toEqual([1]);
  });

  it("passes arrays through unchanged", () => {
    expect(ensureArray(["x", "y"])).toEqual(["x", "y"]);
  });

  it("null/undefined → []", () => {
    expect(ensureArray(undefined)).toEqual([]);
    expect(ensureArray(null)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* toCsv                                                               */
/* ------------------------------------------------------------------ */

describe("helpers/toCsv", () => {
  it("filters empties, dedupes, sorts by default", () => {
    const csv = toCsv(["  b ", "a", "", "b", "a", " c  "]);
    expect(csv).toBe("a,b,c");
  });

  it("can preserve order by disabling sort", () => {
    const csv = toCsv(["b", "a", "b", "a"], { sort: false });
    // still filtered+deduped, but first occurrences preserved → "b,a"
    expect(csv).toBe("b,a");
  });

  it("can keep duplicates by disabling dedupe", () => {
    const csv = toCsv(["b", "a", "b"], { dedupe: false });
    expect(csv).toBe("a,b,b"); // filtered empties + sorted (default true)
  });

  // it("can keep empties by disabling filterEmpty", () => {
  //   const csv = toCsv(["", " a ", ""], { filterEmpty: false });
  //   // no trimming → empty strings remain; sort puts empties first, but join keeps them
  //   expect(csv).toBe(", , a "); // reflects current implementation (no trim when filterEmpty=false)
  // });
});

/* ------------------------------------------------------------------ */
/* isObjectRecord                                                      */
/* ------------------------------------------------------------------ */

describe("helpers/isObjectRecord", () => {
  it("returns true for plain objects and null-prototype objects", () => {
    expect(isObjectRecord({})).toBe(true);
    const o = Object.create(null) as Record<string, unknown>;
    o.a = 1;
    expect(isObjectRecord(o)).toBe(true);
  });

  it("returns false for null and primitives", () => {
    expect(isObjectRecord(null)).toBe(false);
    expect(isObjectRecord("str")).toBe(false);
    expect(isObjectRecord(123)).toBe(false);
    expect(isObjectRecord(true)).toBe(false);
    expect(isObjectRecord(Symbol("s"))).toBe(false);
    expect(isObjectRecord(10n)).toBe(false);
    expect(isObjectRecord(undefined)).toBe(false);
  });

  it("returns false for arrays, functions, boxed primitives, and built-ins", () => {
    class C {}
    expect(isObjectRecord([])).toBe(false);
    expect(isObjectRecord([1, 2, 3])).toBe(false);
    expect(isObjectRecord(() => {})).toBe(false);
    expect(isObjectRecord(new C())).toBe(false);
    expect(isObjectRecord(new Number(1))).toBe(false);
    expect(isObjectRecord(new String("x"))).toBe(false);
    expect(isObjectRecord(new Boolean(true))).toBe(false);
    expect(isObjectRecord(new Date())).toBe(false);
    expect(isObjectRecord(/re/)).toBe(false);
    expect(isObjectRecord(new Map())).toBe(false);
    expect(isObjectRecord(new Set())).toBe(false);
    expect(isObjectRecord(new WeakMap())).toBe(false);
    expect(isObjectRecord(new WeakSet())).toBe(false);
    expect(isObjectRecord(new Uint8Array())).toBe(false);
  });

  it("narrows type for safe access (TS guard)", () => {
    const value: unknown = { foo: "bar" };
    if (isObjectRecord(value)) {
      const foo = value["foo"];
      expect(foo).toBe("bar");
    } else {
      throw new Error("Type guard failed to narrow");
    }
  });
});
