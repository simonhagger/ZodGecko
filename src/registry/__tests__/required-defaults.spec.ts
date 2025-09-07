import { describe, expect, it } from "vitest";

import { GENERATED_REGISTRY } from "../generated.js";

describe("Registry required vs defaults", () => {
  it("requiredQuery implies no default; defaults imply not required", () => {
    for (const e of GENERATED_REGISTRY) {
      const reqQ = new Set(e.requiredQuery);
      const defaults = new Set(Object.keys(e.serverDefaults));

      // required → not in defaults
      for (const k of reqQ) {
        expect(defaults.has(k)).toBe(false);
      }

      // defaulted → not required
      for (const k of defaults) {
        expect(reqQ.has(k as keyof typeof e.serverDefaults)).toBe(false);
      }
    }
  });

  it("queryRules.required mirrors requiredQuery listing", () => {
    for (const e of GENERATED_REGISTRY) {
      const reqQ = new Set(e.requiredQuery);
      const fromRules = new Set(
        e.queryRules.filter((r) => (r as { required?: true }).required === true).map((r) => r.key),
      );

      // They should match exactly (order-agnostic)
      expect([...fromRules].sort()).toEqual([...reqQ].sort());
    }
  });
});
