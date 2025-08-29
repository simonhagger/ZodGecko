/**
 * @file Core tests — Helpers.
 * @module tests/core/helpers
 * @summary Provides unit test code coverage for the helper functions.
 * @see ../../core/common.ts
 */

import { describe, it, expect } from "vitest";

import { ensureArray, isObjectRecord, pick, stripUndefined, toCsv } from "../helpers.js";

describe("Helpers: pick()", () => {
  it("pick function works", () => {
    const S = pick({ a: 1, b: 2, c: 3 }, ["a", "b"]);
    expect(S).toEqual({ a: 1, b: 2 });
  });
});

describe("Helpers: stripUndefined()", () => {
  it("stripUndefined function works", () => {
    const S = stripUndefined({ a: 1, b: 2, c: undefined });
    expect(S).toEqual({ a: 1, b: 2 });
  });
});

describe("Helpers: ensureArray()", () => {
  it("ensureArray function works on a naked string", () => {
    const S = ensureArray("test");
    expect(S).toEqual(["test"]);
  });
  it("ensureArray function works on an array", () => {
    const S = ensureArray(["test"]);
    expect(S).toEqual(["test"]);
  });
  it("ensureArray function works on an undefined", () => {
    const S = ensureArray(undefined);
    expect(S).toEqual([]);
  });
});

describe("Helpers: toCsv()", () => {
  it("toCsv function works on a simple array", () => {
    const S = toCsv(["test1", "test2", "test3"]);
    expect(S).toEqual("test1,test2,test3");
  });
  it("toCsv function works on an array with empty values", () => {
    const S = toCsv(["test1", "", "test3"]);
    expect(S).toEqual("test1,test3");
  });
  it("toCsv function works on an array and sorts values", () => {
    const S = toCsv(["test3", "", "test1"]);
    expect(S).toEqual("test1,test3");
  });
});

describe("isObjectRecord", () => {
  it("returns true for plain objects", () => {
    expect(isObjectRecord({})).toBe(true);
    expect(isObjectRecord({ a: 1 })).toBe(true);
    expect(isObjectRecord(new Object())).toBe(true);
  });

  it("returns true for null-prototype objects", () => {
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

  it("returns false for arrays and functions", () => {
    expect(isObjectRecord([])).toBe(false);
    expect(isObjectRecord([1, 2, 3])).toBe(false);
    expect(isObjectRecord(() => {})).toBe(false);
    // methods, class constructors, etc.
    class C {}
    expect(isObjectRecord(new C())).toBe(false);
  });

  it("returns false for boxed primitives", () => {
    expect(isObjectRecord(new Number(1))).toBe(false);
    expect(isObjectRecord(new String("x"))).toBe(false);
    expect(isObjectRecord(new Boolean(true))).toBe(false);
  });

  it("returns false for built-in non-plain objects", () => {
    expect(isObjectRecord(new Date())).toBe(false);
    expect(isObjectRecord(/re/)).toBe(false);
    expect(isObjectRecord(new Map())).toBe(false);
    expect(isObjectRecord(new Set())).toBe(false);
    expect(isObjectRecord(new WeakMap())).toBe(false);
    expect(isObjectRecord(new WeakSet())).toBe(false);
    expect(isObjectRecord(new Uint8Array())).toBe(false);
  });

  it("narrows the type for safe access (TS check)", () => {
    const value: unknown = { foo: "bar" };
    if (isObjectRecord(value)) {
      // Within this block, value is Record<string, unknown>
      const foo = value["foo"];
      expect(foo).toBe("bar");
    } else {
      throw new Error("Type guard failed to narrow");
    }
  });
});
