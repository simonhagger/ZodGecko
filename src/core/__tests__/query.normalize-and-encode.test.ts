import { describe, it, expect } from "vitest";

import { queryParams, queryString } from "../query.js";

/**
 * NOTE:
 * - queryParams(...) -> URLSearchParams (values are DECODED when you call .get()).
 * - .toString() -> encoded wire format.
 * - queryString(obj) -> encoded string from a plain object (no URLSearchParams involved).
 */

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
