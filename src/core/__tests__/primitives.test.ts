/**
 * @file Core tests — UrlString primitive.
 * @module tests/core/primitives/urlstring
 * @summary Validates URL string coercion/acceptance for http/https and empty-string handling.
 * @remarks
 * - Accepts `http://`/`https://` strings as-is.
 * - Empty string is coerced to `undefined` by design to simplify optional URL fields.
 * @see ../../core/primitives.ts
 */

import { describe, it, expect } from "vitest";

import { UrlString } from "../primitives.js";

describe("UrlString", () => {
  it("accepts http/https and returns same string", () => {
    const u = UrlString.parse("http://example.com");
    expect(u).toBe("http://example.com");
  });

  it("converts empty string to undefined", () => {
    const u = UrlString.parse("");
    expect(u).toBeUndefined();
  });
});
