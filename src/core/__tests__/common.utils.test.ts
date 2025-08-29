/**
 * @file Core tests — tolerantObject & RecordBy utilities.
 * @module tests/core/utils
 * @summary Ensures tolerant object parsing (unknown fields preserved) and typed record construction.
 * @remarks
 * - `tolerantObject` should parse known fields while allowing unknown extras without failure.
 * - `RecordBy(key, value)` constrains both key and value types for `Record<K, V>`.
 * @see ../../core/common.ts
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import { tolerantObject, RecordBy, OneToThreeSixtyFiveString } from "../../core/common.js";

describe("tolerantObject", () => {
  it("accepts extra fields", () => {
    const S = tolerantObject({ id: z.string() });
    expect(S.parse({ id: "x", extra: 1 })).toEqual({ id: "x", extra: 1 });
  });
});

describe("RecordBy", () => {
  it("constrains key/value types", () => {
    const S = RecordBy(z.string(), z.number());
    expect(S.parse({ usd: 1, eur: 2 })).toEqual({ usd: 1, eur: 2 });
  });
});

/** Testing custom format OneToThreeSixtyFiveString compliance */
describe("OneToThreeSixtyFiveString", () => {
  const S = OneToThreeSixtyFiveString;
  it("parses a number under 365 represented as a string", () => {
    expect(S.parse("1")).toEqual("1");
    expect(S.parse("365")).toEqual("365");
  });
  it("does not parse any integer digits", () => {
    expect(S.safeParse(1)).contains({ success: false });
    expect(S.safeParse(366)).contains({ success: false });
  });
  it("does not parse a number over 365 represented as a string", () => {
    expect(S.safeParse("366")).contains({ success: false });
  });
});
