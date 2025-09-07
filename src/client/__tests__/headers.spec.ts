// src/client/__tests__/headers.spec.ts
import { describe, it, expect } from "vitest";

import { defaultHeadersFor, headerNameForPlan } from "../headers.js";

describe("headers", () => {
  it("maps header name by plan", () => {
    expect(headerNameForPlan("public")).toBe("x-cg-demo-api-key");
    expect(headerNameForPlan("paid")).toBe("x-cg-pro-api-key");
  });

  it("adds api key for paid plan", () => {
    const h = defaultHeadersFor({ version: "v3.1.1", plan: "paid" } as const, {
      apiKey: "k",
    }) as Record<string, string>;
    expect(h["x-cg-pro-api-key"]).toBe("k");
  });

  it("merges extra headers last", () => {
    const h = defaultHeadersFor("v3.0.1/public", {
      apiKey: "d",
      extra: { accept: "application/json; charset=utf-8", "x-extra": "1" },
    }) as Record<string, string>;
    expect(h.accept).toBe("application/json; charset=utf-8");
    expect(h["x-cg-demo-api-key"]).toBe("d");
    expect(h["x-extra"]).toBe("1");
  });
});
