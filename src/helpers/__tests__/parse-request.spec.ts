import { describe, expect, it } from "vitest";

import { parseRequest } from "../parse-request.js";

describe("parseRequest", () => {
  it("throws for unknown endpoint id", () => {
    expect(() => parseRequest("no.such.endpoint", { query: {} })).toThrow();
  });

  it("throws when required query is missing (simple.price needs vs_currencies)", () => {
    expect(() => parseRequest("simple.price", { query: {} })).toThrow();
  });

  it("passes with minimal valid request", () => {
    const out = parseRequest("simple.price", { query: { vs_currencies: "usd" } });
    expect(out.query?.vs_currencies).toBe("usd");
  });
});
