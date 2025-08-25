/**
 * @file Core: explainZodError — optional branches coverage (synthetic issues)
 * @purpose Force execution of lines that depend on optional Zod v4 fields:
 *          - invalid_type.received
 *          - too_small.type / too_big.type
 *          - invalid_element.index
 *          - invalid_format.expected
 *          - not_multiple_of.multipleOf
 *          - invalid_key.key / invalid_key.expected
 *          - default/custom branch
 *
 * NOTE: We intentionally synthesize Zod issues here (test-only) to hit branches
 * Zod v4 may not populate in organic errors. We isolate casts to this file.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import { explainZodError } from "../parse-utils.js";

// Minimal helper to build a ZodError from a single synthetic issue.
function makeErr(issue: unknown): z.ZodError {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - constructor expects ZodIssue[]; this is test-only input
  return new z.ZodError([issue]);
}
// Ensures we always return a ZodError (no union with undefined)
const getErr = (schema: z.ZodTypeAny, bad: unknown): z.ZodError => {
  const res = schema.safeParse(bad);
  if (res.success) throw new Error("expected parse failure");
  return res.error;
};

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
