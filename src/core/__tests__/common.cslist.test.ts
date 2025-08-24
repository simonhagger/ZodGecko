/**
 * @file Core tests — CSList (comma-separated list helper).
 * @module tests/core/cslist
 * @summary Verifies CSV normalization: dedupe, sort, trim, and inner-enum validation.
 * @remarks
 * - Input accepts `string | string[]`; output is a stable CSV string.
 * - With an inner enum (e.g., `PriceChangeWindows`) invalid members are rejected by the schema.
 * @see ../../core/common.ts
 */

import { describe, it, expect } from "vitest";

import { CSList, PriceChangeWindows } from "../../core/common.js";

describe("CSList", () => {
  it("dedupes and sorts arrays", () => {
    const S = CSList();
    expect(S.parse(["b", "a", "b"])).toBe("a,b");
  });

  it("trims CSV strings and removes empties", () => {
    const S = CSList();
    expect(S.parse(" a, ,b ,")).toBe("a,b");
  });

  it("validates against inner enum", () => {
    const S = CSList(PriceChangeWindows);
    expect(S.parse(["24h", "7d", "24h"])).toBe("24h,7d");
  });
});
