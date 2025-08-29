/**
 * @file Core tests — Query.
 * @module tests/core/query
 * @summary Provides unit test code coverage for the query functions.
 * @see ../../core/common.ts
 */

import { describe, it, expect } from "vitest";

import {
  applyEncode,
  normalizeDefault,
  normalizeQuery,
  normalizeValue,
  queryString,
} from "../query.js";

describe("Query: applyEncode() (via normalizeValue)", () => {
  it("applyEncode function works (via normalizeValue)", () => {
    const S = normalizeValue("2024-01-02T03:04:05Z", (v): string => v as string);
    expect(S).toEqual("2024-01-02T03:04:05Z");
  });
  it("applyEncode function fails (via normalizeValue) when applyEncode throws, falls back to input value", () => {
    const S = normalizeValue("2024-01-02T03:04:05Z", (v: unknown): string => {
      throw new Error(`purposeful fail on ${v as string}`);
    });
    expect(S).toEqual("2024-01-02T03:04:05Z");
  });
});
describe("Query: normalizeQuery() (via normalizeValue)", () => {
  it("normalizeQuery function works (via normalizeValue) on basic values", () => {
    const S = normalizeQuery({ date: "01-01-2025", id: "bitcoin" });
    expect(S).toEqual([
      ["date", "01-01-2025"],
      ["id", "bitcoin"],
    ]);
  });
  it("normalizeQuery function works on values with csv", () => {
    const S = normalizeQuery({ date: "01-01-2025", id: "bitcoin,ethereum" });
    expect(S).toEqual([
      ["date", "01-01-2025"],
      ["id", "bitcoin,ethereum"],
    ]);
  });
  it("normalizeQuery function works on values in an array", () => {
    const S = normalizeQuery({ date: "01-01-2025", id: ["bitcoin", "ethereum"] });
    expect(S).toEqual([
      ["date", "01-01-2025"],
      ["id", "bitcoin,ethereum"],
    ]);
  });
  it("normalizeQuery function works on values in an array and array mode is repeat", () => {
    const S = normalizeQuery(
      { date: "01-01-2025", id: ["bitcoin", "ethereum"] },
      { array: "repeat" },
    );
    expect(S).toEqual([
      ["date", "01-01-2025"],
      ["id", "bitcoin"],
      ["id", "ethereum"],
    ]);
  });
  it("normalizeQuery function works on values in an array and array mode is bracket", () => {
    const S = normalizeQuery(
      { date: "01-01-2025", id: ["bitcoin", "ethereum"] },
      { array: "bracket" },
    );
    expect(S).toEqual([
      ["date", "01-01-2025"],
      ["id[]", "bitcoin"],
      ["id[]", "ethereum"],
    ]);
  });
  it("normalizeDefault function works on values in an array", () => {
    const S = normalizeDefault(["bitcoin", "ethereum"]);
    expect(S).toEqual("bitcoin,ethereum");
  });
});

describe("Query: queryString()", () => {
  it("queryString function works on basic values", () => {
    const S = queryString({ date: "01-01-2025", id: "bitcoin" });
    expect(S).toEqual("date=01-01-2025&id=bitcoin");
  });
});

describe("Query: applyEncode()", () => {
  it("applyEncode function returns a string when an encode inline function provides a non-string", () => {
    const S = applyEncode(1, (value: unknown): string => {
      return String(value);
    });
    expect(S).toEqual("1");
  });
});

// describe("Query: queryParams()", () => {
//   it("queryParams function works on basic values", () => {
//     const S = queryParams({ id: "bitcoin" }, { array: "comma" });
//     expect(JSON.stringify(S.entries())).toEqual(JSON.stringify([["id[]", "bitcoin"]]));
//   });
// });
