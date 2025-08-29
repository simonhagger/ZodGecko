import { describe, it, expect } from "vitest";
import { z } from "zod";

import { expectParseFail, getErr, makeErr } from "./test-helpers.js";
import {
  safeParseRequest,
  explainZodError,
  toUnixSeconds,
  ddmmyyyy,
  normalizeCoinId,
  normalizeVsCurrencies,
} from "../../core/parse-utils.js";
import { getZodErrorMsgFrom } from "../parse-utils.js";

describe("core/parse-utils", () => {
  it("safeParseRequest returns typed data or formatted message", () => {
    const S = z.object({ vs_currency: z.string() });
    const ok = safeParseRequest(S, { vs_currency: "usd" });
    expect(ok.ok).toBe(true);

    const bad = safeParseRequest(S, { nope: true });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.message).toContain("vs_currency");
    }
  });

  it("explainZodError generates human messages", () => {
    const S = z.object({ id: z.string().min(1) });
    const res = S.safeParse({ id: "" });
    if (!res.success) {
      const msg = explainZodError(res.error, { compact: true });
      expect(msg).toContain("id");
    }
  });

  it("toUnixSeconds handles date, number, and strings", () => {
    const n1 = toUnixSeconds(new Date("2024-05-01T00:00:00Z"));
    const n2 = toUnixSeconds(1714521600);
    const n3 = toUnixSeconds("1714521600");
    expect(n1).toBe(1714521600);
    expect(n2).toBe(1714521600);
    expect(n3).toBe(1714521600);
  });

  it("ddmmyyyy formats a UTC date", () => {
    expect(ddmmyyyy("2024-12-24T00:00:00Z")).toBe("24-12-2024");
  });

  it("normalizeCoinId and normalizeVsCurrencies", () => {
    expect(normalizeCoinId("  Bitcoin  ")).toBe("bitcoin");
    expect(normalizeVsCurrencies(["USD", "eur", "usd", "  GBP "])).toEqual(["eur", "gbp", "usd"]);
    expect(normalizeVsCurrencies("usd, EUR ,usd")).toEqual(["eur", "usd"]);
  });
});

describe("core/ddmmyyyy", () => {
  it("throws TypeError on unparseable input (string)", () => {
    expect(() => ddmmyyyy("not-a-date")).toThrowError(/ddmmyyyy: invalid date/);
  });

  it("throws TypeError on invalid Date instance", () => {
    const invalid = new Date("definitely not a date");
    expect(() => ddmmyyyy(invalid)).toThrowError(/ddmmyyyy: invalid date/);
  });
});
describe("core/toUnixSeconds", () => {
  it("parses an ISO date string via Date.parse and floors to seconds", () => {
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

  // (Optional) sanity: numeric passthrough still floors
  it("accepts numeric-like input (string) and floors", () => {
    expect(toUnixSeconds("1234.9")).toBe(1234);
  });
});
describe("runtime/explainZodError", () => {
  it("invalid_type + (root) path + verbose expected/received-ish", () => {
    const err = expectParseFail(z.number(), "not-a-number");
    const msg = explainZodError(err);
    expect(msg).toContain("(root):");
    expect(msg.toLowerCase()).toContain("expected"); // base or structured
    // Zod v4 always puts 'received string' in the base message; our structured
    // 'received: string' line may or may not appear. Accept either.
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
    expect(msg).toContain("minimum: 3"); // inclusive by default
    // Zod may not expose a structured 'type' field; base message still names string.
    expect(msg.toLowerCase()).toContain("string");
  });

  it("too_big reports maximum; type may or may not be present", () => {
    const S = z.array(z.number()).max(2);
    const err = expectParseFail(S, [1, 2, 3]);
    const msg = explainZodError(err);
    expect(msg).toContain("maximum: 2");
    // Accept either a structured 'type: array' or the base message mentioning array
    expect(msg.toLowerCase()).toContain("array");
  });

  it("invalid_union reports failing variant count (base or structured)", () => {
    const S = z.union([z.string().email(), z.string().url()]);
    const err = expectParseFail(S, "not-an-email-or-url");
    const msg = explainZodError(err);
    // Our helper emits 'union variants failed: N' when Zod exposes nested errors;
    // if not, the base message still clearly indicates union failure.
    expect(msg.toLowerCase()).toSatisfy(
      (s: string) => s.includes("union variants failed") || s.includes("invalid input"),
    );
  });

  it("invalid_key: accept either structured 'key:' or base line naming the key", () => {
    const S = z.map(z.string().regex(/^x/), z.number());
    const err = expectParseFail(S, new Map([["bad", 1]]));
    const msg = explainZodError(err);
    // Some Zod builds don’t expose 'key' on the issue; base line prints 'bad: ...'
    expect(msg.includes("key: bad") || msg.toLowerCase().includes("bad: invalid")).toBe(true);
  });

  it("invalid_element: accept either structured 'index:' or base expected/received", () => {
    const S = z.set(z.number());
    const err = expectParseFail(S, new Set([1, "oops" as unknown as number]));
    const msg = explainZodError(err);
    // Index property isn't guaranteed; base line still shows invalid element info.
    expect(
      msg.includes("index: 1") ||
        (msg.toLowerCase().includes("expected") && msg.toLowerCase().includes("received")),
    ).toBe(true);
  });

  it("invalid_format (email): message mentions email format", () => {
    const S = z.string().email();
    const err = expectParseFail(S, "not-an-email");
    const msg = explainZodError(err);
    // Structured 'expected format: email' is optional; base message contains 'email'
    expect(msg.toLowerCase()).toContain("email");
  });

  it("not_multiple_of: accept either structured 'multipleOf:' or base message", () => {
    const S = z.number().multipleOf(5);
    const err = expectParseFail(S, 7);
    const msg = explainZodError(err);
    expect(msg.includes("multipleOf: 5") || msg.toLowerCase().includes("multiple of 5")).toBe(true);
  });

  it("custom issues fall back to the base message", () => {
    const S = z.number().refine((n) => n > 10, "must be > 10");
    const err = expectParseFail(S, 3);
    const msg = explainZodError(err);
    expect(msg).toContain("(root): must be > 10");
  });

  it("nested path is joined with dots", () => {
    const S = z.object({ a: z.object({ b: z.number() }) });
    const err = expectParseFail(S, { a: { b: "nope" } });
    const msg = explainZodError(err);
    expect(msg.startsWith("a.b:")).toBe(true);
    expect(msg.toLowerCase()).toContain("expected");
  });

  it("compact mode shows only the base lines", () => {
    const err = expectParseFail(z.number(), "nope");
    const msg = explainZodError(err, { compact: true });
    expect(msg).toContain("(root):");
    // Compact: should *not* include our extra lines
    expect(msg).not.toContain("expected:");
    expect(msg).not.toContain("received:");
    expect(msg).not.toContain("minimum:");
    expect(msg).not.toContain("maximum:");
  });
});
describe("explainZodError – omissions (synthetic)", () => {
  it("invalid_type without expected/received → no extra lines", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_type",
      message: "Invalid input",
      path: [],
      // no expected, no received
    });
    expect(msg).toContain("(root): Invalid input");
    expect(msg).not.toContain("expected:");
    expect(msg).not.toContain("received:");
  });

  it("unrecognized_keys with non-array keys → no 'unrecognized keys:' line", () => {
    const msg = getZodErrorMsgFrom({
      code: "unrecognized_keys",
      message: 'Unrecognized key: "x"',
      path: [],
      keys: "x", // not an array → fallback branch
    });
    expect(msg).toContain('(root): Unrecognized key: "x"');
    expect(msg).not.toContain("unrecognized keys:");
  });

  it("invalid_union without errors array → count = 0", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_union",
      message: "Invalid input",
      path: [],
      // errors missing → should print 0
    });
    expect(msg).toContain("union variants failed: 0");
  });

  it("too_small without minimum/inclusive/type → only base line", () => {
    const msg = getZodErrorMsgFrom({
      code: "too_small",
      message: "Too small",
      path: [],
      // no minimum / inclusive / type
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
      // no maximum / inclusive / type
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
      values: "nope", // not an array → fallback branch
    });
    expect(msg).toContain("(root): Invalid value");
    expect(msg).not.toContain("expected one of:");
  });

  it("invalid_key without key/expected → no key/expected lines", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_key",
      message: "Invalid key",
      path: [],
      // no key / expected
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
      // no index
    });
    expect(msg).toContain("(root): Invalid element");
    expect(msg).not.toContain("index:");
  });

  it("invalid_format without expected → no 'expected format:' line", () => {
    const msg = getZodErrorMsgFrom({
      code: "invalid_format",
      message: "Invalid format",
      path: [],
      // no expected
    });
    expect(msg).toContain("(root): Invalid format");
    expect(msg).not.toContain("expected format:");
  });

  it("not_multiple_of without multipleOf → no 'multipleOf:' line", () => {
    const msg = getZodErrorMsgFrom({
      code: "not_multiple_of",
      message: "Invalid number: must be a multiple",
      path: [],
      // no multipleOf
    });
    expect(msg).toContain("(root): Invalid number: must be a multiple");
    expect(msg).not.toContain("multipleOf:");
  });
});
describe("runtime/explainZodError (optional branches via synthetic issues)", () => {
  it("invalid_type → prints expected & received", () => {
    const issue = {
      code: "invalid_type",
      path: [],
      message: "Invalid input: expected number, received string",
      expected: "number",
      received: "string",
    } as unknown; // cast test-only
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("(root):");
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

  it("custom/default branch — does not add structured details", () => {
    const issue = {
      code: "custom",
      path: [],
      message: "Custom validation failed",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("(root): Custom validation failed");
  });

  it("invalid_value → prints expected one of list", () => {
    const issue = {
      code: "invalid_value",
      path: [],
      message: 'Invalid input: expected one of "a" | "b"',
      values: ["a", "b"],
    } as unknown;
    // helper from this file
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain('(root): Invalid input: expected one of "a" | "b"');
    expect(msg).toContain('expected one of: "a", "b"');
  });
});
describe("explainZodError – remaining optional branches", () => {
  it("invalid_type → prints expected & received (explicit synthetic)", () => {
    const issue = {
      code: "invalid_type",
      path: [],
      message: "Invalid input: expected number, received string",
      expected: "number",
      received: "string",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("(root): Invalid input: expected number, received string");
    expect(msg).toContain("expected: number"); // covers: has(issue,"expected")
    expect(msg).toContain("received: string");
  });

  it("unrecognized_keys → collects keys array", () => {
    const issue = {
      code: "unrecognized_keys",
      path: [],
      message: 'Unrecognized key: "extra"',
      keys: ["extra"],
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("unrecognized keys: extra"); // covers: has(issue,"keys") && Array.isArray(...)
  });

  it("invalid_union → reports failures count", () => {
    const S = z.union([z.string(), z.number()]);
    const msg = explainZodError(getErr(S, {}));
    expect(msg).toContain("union variants failed: 2");
  });

  it("too_small (exclusive) → minimum without (inclusive) + type", () => {
    const S = z.number().gt(10);
    const msg = explainZodError(getErr(S, 10));
    expect(msg).toContain("minimum: 10");
    expect(msg).not.toContain("(inclusive)");
  });

  it("too_big (exclusive) → maximum without (inclusive) + type", () => {
    const S = z.number().lt(5);
    const msg = explainZodError(getErr(S, 5));
    expect(msg).toContain("maximum: 5");
    expect(msg).not.toContain("(inclusive)");
  });

  it("invalid_value → prints expected one-of list", () => {
    const issue = {
      code: "invalid_value",
      path: [],
      message: 'Invalid input: expected one of "a" | "b"',
      values: ["a", "b"],
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain('expected one of: "a", "b'); // covers: has(issue,"values") && Array.isArray(...)
  });

  it("invalid_key → prints key and expected", () => {
    const issue = {
      code: "invalid_key",
      path: [],
      message: "Invalid key",
      key: "bad",
      expected: "key /^x/",
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("key: bad"); // covers: has(issue,"key")
    expect(msg).toContain("expected: key /^x/"); // covers: has(issue,"expected") in invalid_key
  });

  it("invalid_element → prints index", () => {
    const issue = {
      code: "invalid_element",
      path: ["set"],
      message: "Invalid element",
      index: 3,
    } as unknown;
    const msg = explainZodError(makeErr(issue));
    expect(msg).toContain("index: 3"); // covers: has(issue,"index")
  });
});
