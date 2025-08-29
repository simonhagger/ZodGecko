/**
 * @file Core tests — Helpers.
 * @module tests/core/helpers
 * @summary Provides unit test code coverage for the helper functions.
 * @see ../../core/common.ts
 */

import { describe, it, expect } from "vitest";

import { ensureArray, pick, stripUndefined, toCsv } from "../helpers.js";

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
