import { describe, expect, it } from "vitest";

import { isValidVersionPlan } from "../../helpers/object.js";
import type { VersionPlanPair } from "../../types.js";
import { createClient } from "../factory.js";

describe("createClient", () => {
  it("creates a client from a version/plan key", () => {
    const c = createClient("v3.0.1/public");
    expect(c.validFor.version).toBe("v3.0.1");
    expect(c.validFor.plan).toBe("public");
  });

  it("creates a client from a VersionPlanPair", () => {
    const vp: VersionPlanPair = { version: "v3.0.1", plan: "public" };
    expect(isValidVersionPlan(vp)).toBe(true);
    const c = createClient(vp);
    expect(c.validFor).toEqual(vp);
  });

  it("applies baseURL override", () => {
    const c = createClient("v3.0.1/public", { baseURL: "https://example.test/base" });
    expect(c.baseURL).toBe("https://example.test/base");
  });

  it("throws for invalid VersionPlanPair", () => {
    // v3.0.1↔public, v3.1.1↔paid; this combo is invalid
    const bad = { version: "v3.0.1", plan: "paid" } as const;
    expect(() => createClient(bad)).toThrow();
  });
});
