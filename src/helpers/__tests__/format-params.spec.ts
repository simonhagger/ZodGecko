// src/helpers/__tests__/format-params.spec.ts
import { describe, expect, it } from "vitest";

import * as registry from "../../registry/index.js";
import { formatParams, formatParamsForEndpoint } from "../format-params.js";

describe("formatParams", () => {
  it("serializes primitives and drops empties deterministically", (): void => {
    const qs = formatParams({
      a: "x",
      b: 2,
      t: true,
      f: false,
      empty: "", // dropped (empty string)
      inf: Infinity, // dropped (non-finite)
    });

    // sorted keys
    expect(Object.keys(qs)).toEqual(["a", "b", "f", "t"]);
    expect(qs.a).toBe("x");
    expect(qs.b).toBe("2");
    expect(qs.t).toBe("true");
    expect(qs.f).toBe("false");

    expect(qs).not.toHaveProperty("empty");
    expect(qs).not.toHaveProperty("inf");
  });

  it("serializes arrays as deduped, sorted CSV", (): void => {
    const qs = formatParams({
      ids: ["eth", "btc", "eth", "ada"] as const,
      nums: [3, 1, 2, 2] as const,
      bools: [true, false, true] as const,
      // empty arrays are allowed and dropped
      none: [] as const,
    });

    expect(qs.ids).toBe("ada,btc,eth");
    expect(qs.nums).toBe("1,2,3");
    expect(qs.bools).toBe("false,true");
    expect(qs).not.toHaveProperty("none");
  });

  it("endpoint-aware variant matches core until registry logic is wired", (): void => {
    const input = { vs_currencies: ["usd", "eur"] as const };
    const a = formatParams(input);
    const b = formatParamsForEndpoint("simple.price", input);
    expect(b).toEqual(a);
  });
  it("respects dropWhenDefault:false and keeps params equal to server defaults", (): void => {
    // Arrange: fake rules/defaults for a throwaway endpoint id
    const rulesSpy = vi
      .spyOn(registry, "getQueryRules")
      .mockReturnValue([{ key: "lang", default: "en", dropWhenDefault: false }]);
    const defaultsSpy = vi.spyOn(registry, "getServerDefaults").mockReturnValue({ lang: "en" });

    // Act
    const out = formatParamsForEndpoint("any.endpoint", { lang: "en" });

    // Assert: value equals default but rule forbids dropping, so it must stay
    expect(out).toEqual({ lang: "en" });

    rulesSpy.mockRestore();
    defaultsSpy.mockRestore();
  });
  it("drops array param when all atoms are non-finite (normalizes to empty)", (): void => {
    const out = formatParams({ x: [Infinity, -Infinity, NaN] as unknown as number[] });
    expect(out).toEqual({});
  });
});
