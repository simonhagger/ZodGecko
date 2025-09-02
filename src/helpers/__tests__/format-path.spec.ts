// src/helpers/__tests__/format-path.spec.ts
import { describe, expect, it } from "vitest";

import { formatPath } from "../format-path.js";

describe("formatPath", () => {
  it("fills tokens and encodes safely", (): void => {
    const out = formatPath("/coins/{id}/markets", { id: "bit coin" });
    expect(out).toBe("coins/bit%20coin/markets");
  });

  it("throws when required param is missing", (): void => {
    expect(() => formatPath("/coins/{id}", {})).toThrowError("Missing path param: id");
  });

  it("ignores leading slash and preserves literals", (): void => {
    const out = formatPath("/simple/price");
    expect(out).toBe("simple/price");
  });
});
