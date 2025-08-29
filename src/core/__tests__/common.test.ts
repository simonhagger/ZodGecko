/**
 * @file Core — building blocks from src/core/common.ts
 * @summary
 *   - CSList: stable CSV normalization (dedupe/sort/trim), supports string | string[]
 *   - tolerantObject: strict known keys + catch-all unknowns (tolerant parsing)
 *   - RecordBy: typed key/value maps
 *   - OneToThreeSixtyFiveString: "1".."365" inclusive (string form, integers only)
 *
 * Notes:
 * - Use .parse for happy paths; .safeParse(...).success for negative checks.
 * - Avoid asserting implementation details (e.g., internal transforms) beyond the contract.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import {
  CSList,
  PriceChangeWindows,
  tolerantObject,
  RecordBy,
  OneToThreeSixtyFiveString,
} from "../common.js";

/* -------------------------------------------------------------------------------------------------
 * CSList
 * ------------------------------------------------------------------------------------------------- */

describe("CSList", () => {
  it("accepts array input: trims, dedupes, sorts → stable CSV", () => {
    const S = CSList();
    expect(S.parse([" b", "a", "b "])).toBe("a,b");
    expect(S.parse(["a"])).toBe("a");
  });

  it("accepts CSV string input: trims segments and removes empties", () => {
    const S = CSList();
    expect(S.parse(" a, ,b ,")).toBe("a,b");
    expect(S.parse("a")).toBe("a");
  });

  it("validates against inner enum (rejects invalid members)", () => {
    const S = CSList(PriceChangeWindows);
    // happy path
    expect(S.parse(["24h", "7d", "24h"])).toBe("24h,7d");
    // invalid member should fail
    const bad = S.safeParse(["24h", "nope"]);
    expect(bad.success).toBe(false);
  });

  it("fails on effectively-empty input after normalization", () => {
    const S = CSList();
    // after trimming + dropping empties, there are no items
    const r1 = S.safeParse([" ", ""]);
    const r2 = S.safeParse(" , , ");
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });
});

/* -------------------------------------------------------------------------------------------------
 * tolerantObject
 * ------------------------------------------------------------------------------------------------- */

describe("tolerantObject", () => {
  it("accepts extra/unknown fields while enforcing known key types", () => {
    const S = tolerantObject({ id: z.string() });

    // unknown preserved
    const ok = S.parse({ id: "x", extra: 1 });
    expect(ok).toEqual({ id: "x", extra: 1 });

    // known key still validated
    const bad = S.safeParse({ id: 123, extra: "kept" });
    expect(bad.success).toBe(false);
  });

  it("works with nested tolerant blocks", () => {
    const Inner = tolerantObject({ n: z.number() });
    const Outer = tolerantObject({ inner: Inner.optional() });

    const ok = Outer.parse({ inner: { n: 1, future: "x" }, extra: true });
    expect(ok).toEqual({ inner: { n: 1, future: "x" }, extra: true });

    const bad = Outer.safeParse({ inner: { n: "NaN" } });
    expect(bad.success).toBe(false);
  });
});

/* -------------------------------------------------------------------------------------------------
 * RecordBy
 * ------------------------------------------------------------------------------------------------- */

describe("RecordBy", () => {
  it("constrains key and value types", () => {
    const S = RecordBy(z.string(), z.number());
    expect(S.parse({ usd: 1, eur: 2 })).toEqual({ usd: 1, eur: 2 });

    // wrong value type
    expect(S.safeParse({ usd: "1" }).success).toBe(false);
  });

  it("rejects keys of the wrong type", () => {
    // keys must be "usd" or "eur"
    const Key = z.string().regex(/^(usd|eur)$/);
    const S = RecordBy(Key, z.number());
    expect(S.safeParse({ usd: 1, eur: 2 }).success).toBe(true);
    expect(S.safeParse({ gbp: 1 }).success).toBe(false);
  });
});

/* -------------------------------------------------------------------------------------------------
 * OneToThreeSixtyFiveString
 * ------------------------------------------------------------------------------------------------- */

describe("OneToThreeSixtyFiveString", () => {
  const S = OneToThreeSixtyFiveString;

  describe("happy path", () => {
    it("accepts string integers in the inclusive range 1..365", () => {
      expect(S.parse("1")).toBe("1");
      expect(S.parse("365")).toBe("365");
      expect(S.parse("42")).toBe("42");
    });
  });

  describe("rejections", () => {
    it("rejects non-string inputs", () => {
      expect(S.safeParse(1).success).toBe(false);
      expect(S.safeParse(366).success).toBe(false);
      expect(S.safeParse(null).success).toBe(false);
    });

    it("rejects out-of-range strings", () => {
      expect(S.safeParse("0").success).toBe(false);
      expect(S.safeParse("366").success).toBe(false);
      expect(S.safeParse("-1").success).toBe(false);
    });

    it("rejects non-integer strings", () => {
      expect(S.safeParse("1.0").success).toBe(false);
      expect(S.safeParse("1.5").success).toBe(false);
    });

    it("rejects whitespace/empty strings", () => {
      expect(S.safeParse("").success).toBe(false);
      expect(S.safeParse("   ").success).toBe(false);
    });
  });
});
