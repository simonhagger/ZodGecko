import { describe, expect, it } from "vitest";

import { parseResponse } from "../parse-response.js";

// Use any small, known-good response you have for simple.price
const ok = { bitcoin: { usd: 12345 } };

describe("parseResponse", () => {
  it("accepts a valid response", () => {
    expect(() => parseResponse("simple.price", ok)).not.toThrow();
  });

  it("rejects a malformed response", () => {
    // e.g., wrong shape for top-level value
    expect(() => parseResponse("simple.price", { bitcoin: 42 })).toThrow();
  });
});
