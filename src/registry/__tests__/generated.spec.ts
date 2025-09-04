// src/registry/__tests__/generated.spec.ts
import { describe, it, expect } from "vitest";

import type { RegistryEntry } from "../../types.js";
import { GENERATED_REGISTRY } from "../generated.js";

// ---------- tiny type-level asserts (not executed) ----------
type IsReadonly<T> = T extends readonly unknown[] ? true : false;
type Expect<T extends true> = T;
// Fails to compile if GENERATED_REGISTRY isn't readonly (i.e., not `as const`)
type _ReadonlyCheck = Expect<IsReadonly<typeof GENERATED_REGISTRY>>;

// ---------- helpers ----------
const PARAM_RE = /\{([^}]+)\}/g;
function paramsFromTemplate(tpl: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = PARAM_RE.exec(tpl))) out.add(m[1]);
  return [...out].sort();
}

const expectAssignable = <T>(_v: T): void => {
  return;
};

describe("generated registry", () => {
  it("is readonly (wider) array of RegistryEntry", () => {
    expectAssignable<readonly RegistryEntry[]>(GENERATED_REGISTRY);
  });
  it("has unique ids", () => {
    const ids = GENERATED_REGISTRY.map((e) => e.id);
    const uniq = new Set(ids);
    expect(uniq.size).toBe(ids.length);
  });

  it("requiredPath matches placeholders in pathTemplate", () => {
    for (const e of GENERATED_REGISTRY) {
      const fromTpl = paramsFromTemplate(e.pathTemplate);
      const declared = [...e.requiredPath].sort();
      expect(declared).toEqual(fromTpl);
    }
  });

  it("has request/response schemas defined", () => {
    for (const e of GENERATED_REGISTRY) {
      expect(e.requestSchema).toBeDefined();
      expect(e.responseSchema).toBeDefined();
    }
  });

  it("each requiredQuery key is present in queryRules (when any)", () => {
    for (const e of GENERATED_REGISTRY) {
      const ruleKeys = new Set(e.queryRules.map((r) => r.key));
      for (const q of e.requiredQuery) {
        expect(ruleKeys.has(q)).toBe(true);
      }
    }
  });
});
