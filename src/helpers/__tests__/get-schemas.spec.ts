import { describe, expect, it } from "vitest";

import { getSchemas } from "../get-schemas.js";

describe("getSchemas", () => {
  it("returns request/response schemas for a known endpoint", () => {
    // Use an endpoint present in your generated registry (e.g., simple.price)
    const { requestSchema, responseSchema } = getSchemas("simple.price");

    // Both should be present for simple.price; if any endpoint lacks a request schema,
    // requestSchema would be null (still valid).
    expect(responseSchema).toBeTruthy();
    expect(typeof (responseSchema as { parse?: unknown }).parse).toBe("function");

    expect(requestSchema).toBeTruthy();
    expect(typeof (requestSchema as { parse?: unknown }).parse).toBe("function");
  });

  it("throws for unknown endpoint ids", () => {
    expect(() => getSchemas("no.such.endpoint")).toThrow();
  });
});
