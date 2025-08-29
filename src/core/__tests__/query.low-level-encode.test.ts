import { describe, it, expect } from "vitest";

import { queryString, queryParams } from "../query.js";

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

    console.log(params.toString());

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
