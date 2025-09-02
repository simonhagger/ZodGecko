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
  queryParams,
  queryString,
} from "../query.js";

describe("Query: applyEncode() (via normalizeValue)", () => {
  it("applyEncode function works (via normalizeValue)", () => {
    const S = normalizeValue("2024-01-02T03:04:05Z", (v): string => v as string);
    expect(S).toEqual("2024-01-02T03:04:05Z");
  });
  it("applyEncode function works (via normalizeDefault) on a numeric value", () => {
    const S = normalizeDefault(1, {
      encode: (v): string => {
        return String(v);
      },
    });
    expect(S).toEqual("1");
  });
  it("applyEncode function works (via normalizeDefault) on an array", () => {
    const S = normalizeDefault(["bob", "marcy", "stan"], {
      encode: (v): string => {
        return Array.isArray(v) ? String(v.join(",")) : String(v);
      },
    });
    expect(S).toEqual("bob,marcy,stan");
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

describe("core/query (low-level)", () => {
  it("encodes scalars, arrays, booleans, numbers", () => {
    const params = queryParams(
      {
        a: "x y",
        b: ["b", "a", "a"],
        c: true,
        d: 42,
      },
      {},
    ); // => URLSearchParams

    // assert via getters
    expect(params.get("a")).toBe("x y");
    expect(params.get("b")).toBe("a,b");
    expect(params.get("c")).toBe("true");
    expect(params.get("d")).toBe("42");

    // or assert the full string
    const qs = params.toString();
    expect(qs).toMatch(/(?:^|&)a=x(\+|%20)y(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)b=a(,|%2C)b(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)c=true(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)d=42(?:&|$)/);
  });

  it("queryString encodes an object input", () => {
    const qs = queryString({
      a: "x y",
      b: ["b", "a", "a"],
      c: true,
      d: 42,
    }); // => string

    expect(qs).toMatch(/(?:^|&)a=x(\+|%20)y(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)b=a(%2C|,)b(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)c=true(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)d=42(?:&|$)/);
  });

  it("drops empties and unsupported types", () => {
    const params = queryParams({
      emptyStr: "   ",
      emptyArr: [],
      obj: {},
      fn: () => {},
      valid: "ok",
    });
    expect(params.get("valid")).toEqual("ok");
  });

  it("coerces finite numbers and drops non-finite", () => {
    const params = queryParams({ n1: 0, n2: Number.NaN, n3: Number.POSITIVE_INFINITY });
    expect(params.get("n1")).toEqual("0");
  });

  it("handles reserved characters safely", () => {
    const qs = queryString({ sym: "a&b=c" });
    expect(qs).toMatch(/sym=a%26b%3Dc/);
  });
});
describe("core/query — normalization (decoded values)", () => {
  it("normalizes scalars, arrays (CSV de-dupe/sort), booleans, numbers", () => {
    const params = queryParams({
      a: "x y", // keep decoded, encode happens on .toString()
      b: ["b", "a", "a"], // CSV, dedupe + sort -> "a,b"
      c: true, // "true"
      d: 42, // "42"
    });

    expect(params.get("a")).toBe("x y"); // decoded
    expect(params.get("b")).toBe("a,b");
    expect(params.get("c")).toBe("true");
    expect(params.get("d")).toBe("42");
  });

  it("drops empties/unsupported (empty string/array/object/function)", () => {
    const params = queryParams({
      emptyStr: "   ",
      emptyArr: [],
      obj: {},
      fn: () => {},
      keep: "ok",
    });
    // Only the valid key remains
    expect(Array.from(params.keys())).toEqual(["keep"]);
    expect(params.get("keep")).toBe("ok");
  });

  it("drops non-finite numbers; keeps finite", () => {
    const params = queryParams({ n1: 0, n2: Number.NaN, n3: Number.POSITIVE_INFINITY });
    expect(params.get("n1")).toBe("0");
    expect(params.has("n2")).toBe(false);
    expect(params.has("n3")).toBe(false);
  });

  it("stable key order (keys sorted before insertion)", () => {
    const params = queryParams({ z: "1", a: "2", m: "3" });
    expect(Array.from(params.keys())).toEqual(["a", "m", "z"]);
  });
});

describe("core/query — wire encoding (.toString())", () => {
  it("encodes reserved characters on serialization", () => {
    const params = queryParams({ sym: "a&b=c", space: "x y" });
    const qs = params.toString(); // encoded
    expect(qs).toMatch(/(?:^|&)sym=a%26b%3Dc(?:&|$)/);
    // Space may be '+' or '%20' depending on platform/URLSearchParams implementation
    expect(qs).toMatch(/(?:^|&)space=x(\+|%20)y(?:&|$)/);
  });

  it("repeat/bracket array modes (explicit options) — smoke", () => {
    // repeat
    const repeat = queryParams({ t: ["b", "a", "a"] }, { array: "repeat" }).toString();
    // order stable (sorted unique: a,b), repeated params
    expect(repeat).toMatch(/(?:^|&)t=a(?:&|$)/);
    expect(repeat).toMatch(/(?:^|&)t=b(?:&|$)/);

    // bracket
    const bracket = queryParams({ t: ["b", "a", "a"] }, { array: "bracket" }).toString();
    expect(bracket).toMatch(/(?:^|&)t(\[|%5B)(\]|%5D)=a(?:&|$)/);
    expect(bracket).toMatch(/(?:^|&)t(\[|%5B)(\]|%5D)=b(?:&|$)/);
  });
});

describe("core/query — queryString(obj) (direct encoded string)", () => {
  it("encodes plain object directly", () => {
    const qs = queryString({
      a: "x y",
      b: ["b", "a", "a"], // CSV "a,b"
      c: true,
      d: 42,
    });
    expect(qs).toMatch(/(?:^|&)a=x(\+|%20)y(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)b=a(,|%2C)b(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)c=true(?:&|$)/);
    expect(qs).toMatch(/(?:^|&)d=42(?:&|$)/);
  });
});

describe("core/query — queryParams(obj) skipNull and skipUndefined", () => {
  it("respects skipNull/skipUndefined options", () => {
    // default skips both
    expect(queryParams({ a: null, b: undefined, c: "x" }).toString()).toBe("c=x");
    // allow null
    expect(queryParams({ a: null }, { skipNull: false }).toString()).toBe("a=null");
    // allow undefined
    expect(queryParams({ b: undefined }, { skipUndefined: false }).toString()).toBe("b=undefined");
  });
});

describe("core/query.ts", () => {
  describe("types & guards", () => {
    it("stable key order", () => {
      const p = queryParams({ z: "1", a: "2", m: "3" });
      expect(Array.from(p.keys())).toEqual(["a", "m", "z"]);
    });
  });

  describe("happy path", () => {
    it("scalars/arrays/booleans/numbers normalize", () => {
      const p = queryParams({ a: "x y", b: ["b", "a", "a"], c: true, d: 42 });
      expect(p.get("a")).toBe("x y"); // decoded
      expect(p.get("b")).toBe("a,b");
      expect(p.get("c")).toBe("true");
      expect(p.get("d")).toBe("42");
    });
  });

  describe("error handling", () => {
    it("drops empties/unsupported", () => {
      const p = queryParams({ emptyStr: "   ", emptyArr: [], obj: {}, fn: () => {}, keep: "ok" });
      expect(Array.from(p.keys())).toEqual(["keep"]);
    });
  });

  describe("edge cases", () => {
    it("skipNull/skipUndefined options honored", () => {
      expect(queryParams({ a: null, b: undefined, c: "x" }).toString()).toBe("c=x");
      expect(queryParams({ a: null }, { skipNull: false }).toString()).toBe("a=null");
      expect(queryParams({ b: undefined }, { skipUndefined: false }).toString()).toBe(
        "b=undefined",
      );
    });
  });

  describe("interop/serialization", () => {
    it("wire encoding on .toString()", () => {
      const qs = queryString({ sym: "a&b=c", space: "x y", list: ["b", "a", "a"] });
      expect(qs).toMatch(/(?:^|&)sym=a%26b%3Dc(?:&|$)/);
      expect(qs).toMatch(/(?:^|&)space=x(\+|%20)y(?:&|$)/);
      expect(qs).toMatch(/(?:^|&)list=a(,|%2C)b(?:&|$)/);
    });
  });
});
