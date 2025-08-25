/**
 * @file Core: toUnixSeconds() – date parsing and failure paths
 * @purpose Cover the Date.parse branch and the error throw path.
 */

import { describe, it, expect } from "vitest";

import { toUnixSeconds } from "../parse-utils.js";

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
