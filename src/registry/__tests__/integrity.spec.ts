/* eslint-disable import/order */
import { describe, expect, it } from "vitest";

import { GENERATED_REGISTRY } from "../generated.js";

import { VERSION_TO_PLAN } from "../../types.js";

/** Extract placeholders from /path/{like_this}/segments/{foo}. */
function placeholdersFromTemplate(tpl: string): string[] {
  const out: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl))) out.push(m[1]);
  return out;
}

describe("Registry integrity", () => {
  it("has entries or stays silent (non-empty in normal dev)", () => {
    expect(Array.isArray(GENERATED_REGISTRY)).toBe(true);
  });

  it("each entry has a valid shape and internal consistency", () => {
    for (const e of GENERATED_REGISTRY) {
      // validFor must match VERSION_TO_PLAN mapping
      const v = e.validFor.version;
      expect(VERSION_TO_PLAN[v]).toBe(e.validFor.plan);

      // method is one of expected
      expect(["GET", "POST", "PUT", "DELETE"]).toContain(e.method);

      // schemas are present
      expect(Boolean(e.requestSchema)).toBe(true);
      expect(Boolean(e.responseSchema)).toBe(true);

      // path placeholders must match requiredPath
      const ph = placeholdersFromTemplate(e.pathTemplate).sort();
      const reqPath = [...e.requiredPath].slice().sort();
      expect(ph).toEqual(reqPath);

      // queryRules keys set and duplicates check
      const ruleKeys = e.queryRules.map((r) => r.key);
      const ruleKeySet = new Set(ruleKeys);
      expect(ruleKeySet.size).toBe(ruleKeys.length);

      // requiredQuery ⊆ queryRules keys
      const reqQ = new Set(e.requiredQuery);
      for (const k of reqQ) {
        expect(ruleKeySet.has(k)).toBe(true);
      }

      // serverDefaults keys ⊆ queryRules keys
      const sdKeys = Object.keys(e.serverDefaults);
      if (sdKeys.length) {
        for (const k of sdKeys) {
          expect(ruleKeySet.has(k as keyof typeof e.serverDefaults)).toBe(true);
        }
      }

      // rules with default must mirror serverDefaults[key] === default
      const defaultsFromRules = new Map<string, unknown>();
      for (const r of e.queryRules) {
        if (Object.prototype.hasOwnProperty.call(r, "default")) {
          defaultsFromRules.set(r.key, (r as { default: unknown }).default);
        }
      }
      for (const [k, vDefault] of defaultsFromRules) {
        expect(e.serverDefaults).toHaveProperty(k);
        expect(e.serverDefaults[k as keyof typeof e.serverDefaults]).toEqual(vDefault);
      }

      // requiredQuery keys must not have a default
      for (const r of e.queryRules) {
        if (reqQ.has(r.key as keyof typeof e.queryRules.keys)) {
          expect(Object.prototype.hasOwnProperty.call(r, "default")).toBe(false);
        }
      }

      // no overlap serverDefaults ∩ requiredQuery
      for (const k of sdKeys) {
        expect(reqQ.has(k as keyof typeof e.serverDefaults)).toBe(false);
      }
    }
  });

  it("ids × version × plan are unique (no duplicate entries)", () => {
    const seen = new Set<string>();
    for (const e of GENERATED_REGISTRY) {
      const key = `${e.id}__${e.validFor.version}__${e.validFor.plan}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
