import { describe, it, expect, vi } from "vitest";

describe("buildQuery with ARRAY defaults (coverage for normalizeDefault)", () => {
  it("drops param when its normalized array equals the default array", async () => {
    vi.resetModules();
    vi.doMock("../server-defaults.js", () => ({
      serverDefaults: {
        "/array/default": { tags: ["b", "a"] }, // default as ARRAY (unsorted)
      },
    }));
    const { buildQuery } = await import("../query.js"); // import AFTER mock
    const out = buildQuery("/array/default", {
      tags: ["a", "b", "a"], // dedupe+sort -> "a,b" == default normalized -> drop
    });
    expect(out).toEqual({});
  });

  it("keeps param when its normalized array DIFFERS from the default array", async () => {
    vi.resetModules();
    vi.doMock("../server-defaults.js", () => ({
      serverDefaults: {
        "/array/default": { tags: ["a", "b"] },
      },
    }));
    const { buildQuery } = await import("../query.js"); // import AFTER mock
    const out = buildQuery("/array/default", {
      tags: ["b", "c", "a"], // -> "a,b,c" != default "a,b" -> keep
    });
    expect(out).toEqual({ tags: "a,b,c" });
  });
});
