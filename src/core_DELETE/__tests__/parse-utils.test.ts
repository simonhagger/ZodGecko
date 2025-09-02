/**
 * @file Core — parse-utils unit tests (src/core/parse-utils.ts)
 * @summary
 *   - safeParseRequest: schema-first request parsing with friendly error
 *   - explainZodError: human-readable Zod error flattening (real + synthetic)
 *   - toUnixSeconds: normalize Date/number/string → unix seconds
 *   - ddmmyyyy: UTC formatter to DD-MM-YYYY with strict validation
 *   - normalizeCoinId / normalizeVsCurrencies: casing, trimming, and de-dupe
 *
 * Conventions:
 * - Use compact expectations where the message content may vary by Zod build.
 * - Keep “synthetic” issue tests separate from real schema failures.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import { expectParseFail, makeErr } from "./_utils/test-helpers.js";
import {
  safeParseRequest,
  explainZodError,
  toUnixSeconds,
  ddmmyyyy,
  normalizeCoinId,
  normalizeVsCurrencies,
} from "../../core/parse-utils.js";
// Helper that renders a single line for a synthetic issue (kept from your suite)
import { getZodErrorMsgFrom } from "../parse-utils.js";

/* -------------------------------------------------------------------------------------------------
 * safeParseRequest
 * ------------------------------------------------------------------------------------------------- */

describe("core/parse-utils — safeParseRequest", () => {
  it("returns typed data on success; message on failure", () => {
    const S = z.object({ vs_currency: z.string() });

    const ok = safeParseRequest(S, { vs_currency: "usd" });
    expect(ok.ok).toBe(true);

    const bad = safeParseRequest(S, { nope: true });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.message).toContain("vs_currency");
    }
  });
});

/* -------------------------------------------------------------------------------------------------
 * explainZodError (real schema errors)
 * ------------------------------------------------------------------------------------------------- */

describe("core/parse-utils — explainZodError (real errors)", () => {
  it("invalid_type + (root) path + expected/received-ish", () => {
    const err = expectParseFail(z.number(), "not-a-number");
    const msg = explainZodError(err);
    expect(msg).toContain("(root):");
    expect(msg.toLowerCase()).toContain("expected");
    expect(msg.toLowerCase()).toContain("received");
  });

  it("unrecognized_keys lists offending keys", () => {
    const S = z.object({ a: z.string() }).strict();
    const err = expectParseFail(S, { a: "ok", extra: 1 });
    const msg = explainZodError(err);
    expect(msg).toContain("(root):");
    expect(msg).toContain("unrecognized keys: extra");
  });

  it("too_small reports minimum; type may or may not be present", () => {
    const S = z.string().min(3);
    const err = expectParseFail(S, "no");
    const msg = explainZodError(err);
    expect(msg).toContain("minimum: 3");
    expect(msg.toLowerCase()).toContain("string");
  });

  it("too_big reports maximum; type may or may not be present", () => {
    const S = z.array(z.number()).max(2);
    const err = expectParseFail(S, [1, 2, 3]);
    const msg = explainZodError(err);
    expect(msg).toContain("maximum: 2");
    expect(msg.toLowerCase()).toContain("array");
  });

  it("invalid_union reports failing variant count (base or structured)", () => {
    const S = z.union([z.string().email(), z.string().url()]);
    const err = expectParseFail(S, "not-an-email-or-url");
    const msg = explainZodError(err);
    expect(msg.toLowerCase()).toSatisfy(
      (s: string) => s.includes("union variants failed") || s.includes("invalid input"),
    );
  });

  it("invalid_key: accept either structured 'key:' or base key line", () => {
    const S = z.map(z.string().regex(/^x/), z.number());
    const err = expectParseFail(S, new Map([["bad", 1]]));
    const msg = explainZodError(err);
    expect(msg.includes("key: bad") || msg.toLowerCase().includes("bad: invalid")).toBe(true);
  });

  it("invalid_element: accept either 'index:' or base expected/received", () => {
    const S = z.set(z.number());
    const err = expectParseFail(S, new Set([1, "oops" as unknown as number]));
    const msg = explainZodError(err);
    expect(
      msg.includes("index: 1") ||
        (msg.toLowerCase().includes("expected") && msg.toLowerCase().includes("received")),
    ).toBe(true);
  });

  it("invalid_format (email) mentions email", () => {
    const S = z.string().email();
    const err = expectParseFail(S, "not-an-email");
    const msg = explainZodError(err);
    expect(msg.toLowerCase()).toContain("email");
  });

  it("not_multiple_of: prints multipleOf or base wording", () => {
    const S = z.number().multipleOf(5);
    const err = expectParseFail(S, 7);
    const msg = explainZodError(err);
    expect(msg.includes("multipleOf: 5") || msg.toLowerCase().includes("multiple of 5")).toBe(true);
  });

  it("nested path is joined with dots", () => {
    const S = z.object({ a: z.object({ b: z.number() }) });
    const err = expectParseFail(S, { a: { b: "nope" } });
    const msg = explainZodError(err);
    expect(msg.startsWith("a.b:")).toBe(true);
    expect(msg.toLowerCase()).toContain("expected");
  });

  it("compact mode suppresses structured lines", () => {
    const err = expectParseFail(z.number(), "nope");
    const msg = explainZodError(err, { compact: true });
    expect(msg).toContain("(root):");
    expect(msg).not.toContain("expected:");
    expect(msg).not.toContain("received:");
    expect(msg).not.toContain("minimum:");
    expect(msg).not.toContain("maximum:");
  });
});

/* -------------------------------------------------------------------------------------------------
 * explainZodError (synthetic omissions to cover fallback branches)
 * ------------------------------------------------------------------------------------------------- */

describe("core/parse-utils — explainZodError (synthetic omissions)", () => {
  it("invalid_type without expected/received → only base line", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_type",
      message: "Invalid input",
      path: [],
    });
    expect(msg).toContain("(root): Invalid input");
    expect(msg).not.toContain("expected:");
    expect(msg).not.toContain("received:");
  });

  it("unrecognized_keys with non-array keys → no 'unrecognized keys:'", () => {
    const msg = getZodErrorMsgFrom({
      code: "unrecognized_keys",
      message: 'Unrecognized key: "x"',
      path: [],
      keys: "x" as unknown as string[], // force fallback branch
    });
    expect(msg).toContain('(root): Unrecognized key: "x"');
    expect(msg).not.toContain("unrecognized keys:");
  });

  it("invalid_union without errors → count = 0", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_union",
      message: "Invalid input",
      path: [],
    });
    expect(msg).toContain("union variants failed: 0");
  });

  it("too_small without minimum/inclusive/type → only base line", () => {
    const msg = getZodErrorMsgFrom({
      code: "too_small",
      message: "Too small",
      path: [],
    });
    expect(msg).toContain("(root): Too small");
    expect(msg).not.toContain("minimum:");
    expect(msg).not.toContain("(inclusive)");
    expect(msg).not.toContain("type:");
  });

  it("too_big without maximum/inclusive/type → only base line", () => {
    const msg = getZodErrorMsgFrom({
      code: "too_big",
      message: "Too big",
      path: [],
    });
    expect(msg).toContain("(root): Too big");
    expect(msg).not.toContain("maximum:");
    expect(msg).not.toContain("(inclusive)");
    expect(msg).not.toContain("type:");
  });

  it("invalid_value with non-array values → no 'expected one of:'", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_value",
      message: "Invalid value",
      path: [],
      values: "nope" as unknown as string[],
    });
    expect(msg).toContain("(root): Invalid value");
    expect(msg).not.toContain("expected one of:");
  });

  it("invalid_key without key/expected → no key/expected lines", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_key",
      message: "Invalid key",
      path: [],
    });
    expect(msg).toContain("(root): Invalid key");
    expect(msg).not.toContain("key:");
    expect(msg).not.toContain("expected:");
  });

  it("invalid_element without index → no 'index:' line", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_element",
      message: "Invalid element",
      path: [],
    });
    expect(msg).toContain("(root): Invalid element");
    expect(msg).not.toContain("index:");
  });

  it("invalid_format without expected → no 'expected format:' line", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_format",
      message: "Invalid format",
      path: [],
    });
    expect(msg).toContain("(root): Invalid format");
    expect(msg).not.toContain("expected format:");
  });

  it("not_multiple_of without multipleOf → no 'multipleOf:' line", () => {
    const msg = getZodErrorMsgFrom({
      code: "not_multiple_of",
      message: "Invalid number: must be a multiple",
      path: [],
    });
    expect(msg).toContain("(root): Invalid number: must be a multiple");
    expect(msg).not.toContain("multipleOf:");
  });
});

/* -------------------------------------------------------------------------------------------------
 * explainZodError (synthetic positive branches to lock coverage)
 * ------------------------------------------------------------------------------------------------- */

describe("core/parse-utils — explainZodError (synthetic positive branches)", () => {
  it("invalid_type → prints expected & received", () => {
    const issue = {
      code: "invalid_type",
      path: [],
      message: "Invalid input: expected number, received string",
      expected: "number",
      received: "string",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("(root): Invalid input: expected number, received string");
    expect(msg).toContain("expected: number");
    expect(msg).toContain("received: string");
  });

  it("too_small → prints minimum (inclusive) and type", () => {
    const issue = {
      code: "too_small",
      path: [],
      message: "Too small: expected string to have >=3 characters",
      minimum: 3,
      inclusive: true,
      type: "string",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("minimum: 3 (inclusive)");
    expect(msg).toContain("type: string");
  });

  it("too_big → prints maximum (inclusive) and type", () => {
    const issue = {
      code: "too_big",
      path: [],
      message: "Too big: expected array to have <=2 items",
      maximum: 2,
      inclusive: true,
      type: "array",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("maximum: 2 (inclusive)");
    expect(msg).toContain("type: array");
  });

  it("invalid_element → prints index when present", () => {
    const issue = {
      code: "invalid_element",
      path: ["set"],
      message: "Invalid element in set",
      index: 1,
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("index: 1");
  });

  it("invalid_format → prints expected format when present", () => {
    const issue = {
      code: "invalid_format",
      path: ["email"],
      message: "Invalid email address",
      expected: "email",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("expected format: email");
  });

  it("not_multiple_of → prints multipleOf when present", () => {
    const issue = {
      code: "not_multiple_of",
      path: [],
      message: "Invalid number: must be a multiple of 5",
      multipleOf: 5,
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("multipleOf: 5");
  });

  it("invalid_key → prints key and expected when present", () => {
    const issue = {
      code: "invalid_key",
      path: [],
      message: "Invalid key",
      key: "bad",
      expected: "string",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("key: bad");
    expect(msg).toContain("expected: string");
  });

  it("custom branch: no structured details", () => {
    const issue = {
      code: "custom",
      path: [],
      message: "Custom validation failed",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("(root): Custom validation failed");
  });

  it("invalid_value → prints expected one-of list", () => {
    const issue = {
      code: "invalid_value",
      path: [],
      message: 'Invalid input: expected one of "a" | "b"',
      values: ["a", "b"],
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain('(root): Invalid input: expected one of "a" | "b"');
    expect(msg).toContain('expected one of: "a", "b"');
  });
});

/* -------------------------------------------------------------------------------------------------
 * ddmmyyyy
 * ------------------------------------------------------------------------------------------------- */

describe("core/parse-utils — ddmmyyyy", () => {
  it("formats a UTC date string to DD-MM-YYYY", () => {
    expect(ddmmyyyy("2024-12-24T00:00:00Z")).toBe("24-12-2024");
  });

  it("throws TypeError on unparseable string input", () => {
    expect(() => ddmmyyyy("not-a-date")).toThrowError(/ddmmyyyy: invalid date/);
  });

  it("throws TypeError on invalid Date instance", () => {
    const invalid = new Date("definitely not a date");
    expect(() => ddmmyyyy(invalid)).toThrowError(/ddmmyyyy: invalid date/);
  });
});

/* -------------------------------------------------------------------------------------------------
 * toUnixSeconds
 * ------------------------------------------------------------------------------------------------- */

describe("core/parse-utils — toUnixSeconds", () => {
  it("normalizes Date, number, and numeric string", () => {
    const n1 = toUnixSeconds(new Date("2024-05-01T00:00:00Z"));
    const n2 = toUnixSeconds(1714521600);
    const n3 = toUnixSeconds("1714521600");
    expect(n1).toBe(1714521600);
    expect(n2).toBe(1714521600);
    expect(n3).toBe(1714521600);
  });

  it("parses an ISO string via Date.parse and floors to seconds", () => {
    const iso = "2024-05-01T00:00:10Z";
    const expected = Math.floor(Date.parse(iso) / 1000);
    expect(toUnixSeconds(iso)).toBe(expected);
  });

  it("throws TypeError on an unparseable string with a helpful message", () => {
    const bad = "totally-not-a-date";
    expect(() => toUnixSeconds(bad)).toThrowError(
      new TypeError(`toUnixSeconds: cannot parse "${bad}"`),
    );
  });

  it("accepts numeric-like input (string) and floors", () => {
    expect(toUnixSeconds("1234.9")).toBe(1234);
  });
});

/* -------------------------------------------------------------------------------------------------
 * normalizeCoinId / normalizeVsCurrencies
 * ------------------------------------------------------------------------------------------------- */

describe("core/parse-utils — normalize helpers", () => {
  it("normalizeCoinId trims and lowercases", () => {
    expect(normalizeCoinId("  Bitcoin  ")).toBe("bitcoin");
  });

  it("normalizeVsCurrencies handles arrays: trim, lowercase, dedupe, sort", () => {
    expect(normalizeVsCurrencies(["USD", "eur", "usd", "  GBP "])).toEqual(["eur", "gbp", "usd"]);
  });

  it("normalizeVsCurrencies handles CSV string", () => {
    expect(normalizeVsCurrencies("usd, EUR ,usd")).toEqual(["eur", "usd"]);
  });
});
