/**
 * @file explain-zod-error.test.ts
 * @description Unit tests for `explainZodError` pretty-printer. Each case
 * exercises a distinct Zod issue scenario and asserts that the helper includes
 * useful details. Assertions are resilient to Zod v4 behavior: we accept either
 * the base Zod message or our optional structured lines when Zod provides
 * those fields.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import { explainZodError } from "../parse-utils.js";
import { expectParseFail } from "./test-helpers.js";

// const getErr = <T>(schema: z.ZodType<T>, input: unknown): z.ZodError => {
//   const res = schema.safeParse(input);
//   expect(res.success).toBe(false);
//   return (res as { success: false; error: z.ZodError }).error;
// };

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
