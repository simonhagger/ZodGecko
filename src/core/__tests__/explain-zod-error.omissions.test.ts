/**
 * @file Runtime: explainZodError() — omissions coverage (test-only synthetic issues)
 * @purpose Exercise defensive branches where optional fields (expected/received, keys, errors,
 *          minimum/maximum/inclusive/type, values, key/expected, index, expected format, multipleOf)
 *          are *absent* — something real Zod errors rarely do. We synthesize issues to cover them.
 *
 * Notes:
 * - We intentionally construct partial issue objects and wrap them in ZodError.
 * - This is safe for tests and clearly documented; production code never relies on this.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import { explainZodError } from "../parse-utils.js";

// Helper: build a ZodError from a *partial* issue to exercise fallback branches.
/* eslint-disable @typescript-eslint/ban-ts-comment */
function msgFrom(issue: Record<string, unknown>): string {
  // @ts-expect-error test-only: constructing minimal issue objects for coverage
  const err = new z.ZodError([issue]);
  return explainZodError(err);
}
/* eslint-enable @typescript-eslint/ban-ts-comment */

describe("explainZodError – omissions (synthetic)", () => {
  it("invalid_type without expected/received → no extra lines", () => {
    const msg = msgFrom({
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
    const msg = msgFrom({
      code: "unrecognized_keys",
      message: 'Unrecognized key: "x"',
      path: [],
      keys: "x", // not an array → fallback branch
    });
    expect(msg).toContain('(root): Unrecognized key: "x"');
    expect(msg).not.toContain("unrecognized keys:");
  });

  it("invalid_union without errors array → count = 0", () => {
    const msg = msgFrom({
      code: "invalid_union",
      message: "Invalid input",
      path: [],
      // errors missing → should print 0
    });
    expect(msg).toContain("union variants failed: 0");
  });

  it("too_small without minimum/inclusive/type → only base line", () => {
    const msg = msgFrom({
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
    const msg = msgFrom({
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
    const msg = msgFrom({
      code: "invalid_value",
      message: "Invalid value",
      path: [],
      values: "nope", // not an array → fallback branch
    });
    expect(msg).toContain("(root): Invalid value");
    expect(msg).not.toContain("expected one of:");
  });

  it("invalid_key without key/expected → no key/expected lines", () => {
    const msg = msgFrom({
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
    const msg = msgFrom({
      code: "invalid_element",
      message: "Invalid element",
      path: [],
      // no index
    });
    expect(msg).toContain("(root): Invalid element");
    expect(msg).not.toContain("index:");
  });

  it("invalid_format without expected → no 'expected format:' line", () => {
    const msg = msgFrom({
      code: "invalid_format",
      message: "Invalid format",
      path: [],
      // no expected
    });
    expect(msg).toContain("(root): Invalid format");
    expect(msg).not.toContain("expected format:");
  });

  it("not_multiple_of without multipleOf → no 'multipleOf:' line", () => {
    const msg = msgFrom({
      code: "not_multiple_of",
      message: "Invalid number: must be a multiple",
      path: [],
      // no multipleOf
    });
    expect(msg).toContain("(root): Invalid number: must be a multiple");
    expect(msg).not.toContain("multipleOf:");
  });
});
