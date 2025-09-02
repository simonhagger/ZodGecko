import { describe, expect, it } from "vitest";

import { DEFAULT_BASE_BY_VERSION, defaultBaseFor } from "../defaults.js";
import { createClient } from "../factory.js";

describe("client defaults", () => {
  it("maps version/plan to default base with /v3", () => {
    expect(DEFAULT_BASE_BY_VERSION["v3.0.1/public"]).toMatch(/\/api\/v3$/u);
    expect(DEFAULT_BASE_BY_VERSION["v3.1.1/paid"]).toMatch(/\/api\/v3$/u);
  });

  it("defaultBaseFor returns the mapped base", () => {
    expect(defaultBaseFor("v3.0.1/public")).toBe(DEFAULT_BASE_BY_VERSION["v3.0.1/public"]);
  });

  it("ZodGecko uses version/plan default base unless overridden", () => {
    const c1 = createClient("v3.0.1/public");
    expect(c1.baseURL).toBe(DEFAULT_BASE_BY_VERSION["v3.0.1/public"]);

    const c2 = createClient("v3.1.1/paid", { baseURL: "https://example.com/x" });
    expect(c2.baseURL).toBe("https://example.com/x");
  });
});
