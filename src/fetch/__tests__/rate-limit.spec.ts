// src/fetch/__tests__/rate-limit.spec.ts
import { describe, it, expect } from "vitest";

import { parseRateLimitHeaders, parseRateLimitNumbers } from "../rate-limit.js";

describe("rate limits", () => {
  it("parses from Headers", () => {
    const h = new Headers({
      "x-cgpro-api-limit": "100",
      "x-cgpro-api-remaining": "93",
      "x-cgpro-api-reset": "1699999999",
    });
    const out = parseRateLimitHeaders(h);
    expect(out["x-cgpro-api-limit"]).toBe("100");
  });

  it("parses from plain object", () => {
    const out = parseRateLimitNumbers({ "x-cgpro-api-limit": "50" });
    expect(out.limit).toBe(50);
    expect(out.remaining).toBeUndefined();
  });
});
