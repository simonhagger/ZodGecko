// src/helpers/__tests__/explain-error.spec.ts
import { describe, expect, it } from "vitest";

import { explainError } from "../explain-error.js";

describe("explainError", () => {
  it("returns message for Error instances", (): void => {
    const msg = explainError(new Error("boom"));
    expect(msg).toBe("boom");
  });

  it("JSON-stringifies plain objects", (): void => {
    const msg = explainError({ code: 400, message: "Bad Request" });
    expect(msg).toBe('{"code":400,"message":"Bad Request"}');
  });

  it("falls back to String() when JSON fails (e.g., BigInt)", (): void => {
    // JSON.stringify(BigInt) throws; we fall back to String(err)
    const msg = explainError(BigInt(42));
    expect(msg).toBe("42");
  });
});
