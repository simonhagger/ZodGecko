/**
 * @file Core — primitives tests (src/core/primitives.ts)
 * @summary
 *   Exhaustive, intention-revealing tests for:
 *   - ISODateTime, DdMmYyyy
 *   - UrlString (http/https + empty handling)
 *   - NonEmptyString, NullableString
 *   - DefaultTrueBoolean, DefaultFalseBoolean
 *   - CoercedNumber, NullableNumber
 *   - VsQuote, VsQuoteString
 *   - brand() surface (runtime parity)
 *
 * Notes:
 * - We prefer `safeParse` for failure assertions to avoid coupling to messages.
 * - We only test formatting guarantees the schemas actually encode (e.g., regex shape),
 *   not deeper calendar semantics.
 */

import { describe, it, expect } from "vitest";

import {
  ISODateTime,
  DdMmYyyy,
  UrlString,
  NonEmptyString,
  NullableString,
  DefaultTrueBoolean,
  DefaultFalseBoolean,
  CoercedNumber,
  NullableNumber,
  VsQuote,
  VsQuoteString,
  brand,
} from "../primitives.js";

/* ------------------------------------------------------------------ */
/* ISODateTime                                                         */
/* ------------------------------------------------------------------ */
describe("ISODateTime", () => {
  it("accepts Z-suffix UTC", () => {
    const ok = [
      "2024-01-01T00:00:00Z",
      "2024-12-31T23:59:59Z",
      "2025-08-28T05:28:34Z",
      "2025-08-28T05:28:34.123Z",
    ];
    for (const s of ok) expect(ISODateTime.safeParse(s).success).toBe(true);
  });

  it("accepts explicit UTC offset (+/-HH:MM) with optional fractional seconds", () => {
    const ok = [
      "2025-08-28T05:28:34+00:00",
      "2025-08-28T05:28:34-05:30",
      "2025-08-28T05:28:34.250+09:00",
    ];
    for (const s of ok) expect(ISODateTime.safeParse(s).success).toBe(true);
  });

  it("rejects bad shapes", () => {
    const bad = [
      "2025-08-28 05:28:34Z", // space not T
      "2025-08-28T05:28Z", // missing seconds
      "2025-08-28T05:28:34+0000", // missing colon in offset
      "not-a-date",
      "",
    ];
    for (const s of bad) expect(ISODateTime.safeParse(s).success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* DdMmYyyy                                                            */
/* ------------------------------------------------------------------ */
describe("DdMmYyyy", () => {
  it("accepts dd-mm-yyyy with optional leading zeros", () => {
    const ok = ["01-01-2024", "1-1-2024", "31-12-1999", "09-10-2025"];
    for (const s of ok) expect(DdMmYyyy.safeParse(s).success).toBe(true);
  });

  it("rejects invalid day/month ranges and shapes", () => {
    const bad = ["32-01-2024", "00-01-2024", "31-13-2024", "31/12/2024", "2024-12-31", ""];
    for (const s of bad) expect(DdMmYyyy.safeParse(s).success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* UrlString (http/https or empty => undefined)                        */
/* ------------------------------------------------------------------ */
describe("UrlString", () => {
  it("accepts http/https and returns same string", () => {
    const u1 = UrlString.parse("http://example.com");
    const u2 = UrlString.parse("https://example.com/path?q=1#frag");
    expect(u1).toBe("http://example.com");
    expect(u2).toBe("https://example.com/path?q=1#frag");
  });

  it("coerces empty/whitespace-only string to undefined", () => {
    expect(UrlString.parse("")).toBeUndefined();
    const r = UrlString.safeParse("   ");
    // .trim() lives inside HttpUrl; whitespace-only won’t match the URL regex.
    expect(r.success).toBe(false);
  });

  it("rejects non-http(s) schemes and junk strings", () => {
    expect(UrlString.safeParse("ftp://x").success).toBe(false);
    expect(UrlString.safeParse("mailto:a@b").success).toBe(false);
    expect(UrlString.safeParse("not a url").success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Strings + booleans                                                  */
/* ------------------------------------------------------------------ */
describe("NonEmptyString / NullableString", () => {
  it("NonEmptyString must be length ≥ 1", () => {
    expect(NonEmptyString.safeParse("x").success).toBe(true);
    expect(NonEmptyString.safeParse("").success).toBe(false);
  });

  it("NullableString accepts string or null, not undefined", () => {
    expect(NullableString.safeParse("x").success).toBe(true);
    expect(NullableString.safeParse(null).success).toBe(true);
    expect(NullableString.safeParse(undefined).success).toBe(false);
  });
});

describe("DefaultTrueBoolean / DefaultFalseBoolean", () => {
  it("DefaultTrueBoolean yields true when input is undefined", () => {
    // .parse(undefined) returns default
    expect(DefaultTrueBoolean.parse(undefined)).toBe(true);
    expect(DefaultTrueBoolean.parse(false)).toBe(false);
  });

  it("DefaultFalseBoolean yields false when input is undefined", () => {
    expect(DefaultFalseBoolean.parse(undefined)).toBe(false);
    expect(DefaultFalseBoolean.parse(true)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */
describe("CoercedNumber", () => {
  it("coerces numeric strings and accepts numbers", () => {
    expect(CoercedNumber.parse("42")).toBe(42);
    expect(CoercedNumber.parse(7)).toBe(7);
    expect(CoercedNumber.parse(" 5 ")).toBe(5);
  });

  it("rejects non-numeric strings and NaN", () => {
    expect(CoercedNumber.safeParse("abc").success).toBe(false);
    expect(CoercedNumber.safeParse(NaN).success).toBe(false);
  });
});

describe("NullableNumber", () => {
  it("accepts number or null; rejects undefined", () => {
    expect(NullableNumber.safeParse(1).success).toBe(true);
    expect(NullableNumber.safeParse(null).success).toBe(true);
    expect(NullableNumber.safeParse(undefined).success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Quote maps                                                          */
/* ------------------------------------------------------------------ */
describe("VsQuote / VsQuoteString", () => {
  it("VsQuote: values are number or null", () => {
    const ok = VsQuote.safeParse({ usd: 1, eur: null });
    const bad = VsQuote.safeParse({ usd: "1" as unknown as number });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it("VsQuoteString: values are string or null", () => {
    const ok = VsQuoteString.safeParse({ usd: "1.23", eur: null });
    const bad = VsQuoteString.safeParse({ usd: 1 as unknown as string });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* brand()                                                             */
/* ------------------------------------------------------------------ */
describe("brand()", () => {
  it("returns a schema that behaves like the underlying schema at runtime", () => {
    const CoinId = brand(NonEmptyString, "CoinId");
    // Runtime behavior should be identical to NonEmptyString
    expect(CoinId.parse("bitcoin")).toBe("bitcoin");
    expect(CoinId.safeParse("").success).toBe(false);
  });

  it("can be layered on other primitives (e.g., ISODateTime) without changing runtime semantics", () => {
    const EventTime = brand(ISODateTime, "EventTime");
    expect(EventTime.safeParse("2024-01-01T00:00:00Z").success).toBe(true);
    expect(EventTime.safeParse("nope").success).toBe(false);
  });
});
