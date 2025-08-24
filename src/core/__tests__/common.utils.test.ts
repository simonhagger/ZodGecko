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

import { tolerantObject, RecordBy } from "../../core/common.js";

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
