// src/helpers/__tests__/to-url.spec.ts
import { describe, expect, it } from "vitest";

import { toURL } from "../to-url.js";

describe("toURL", () => {
  it("joins base and path without double slashes", (): void => {
    const url = toURL("https://api.coingecko.com/api/", "/coins/bitcoin");
    expect(url).toBe("https://api.coingecko.com/api/coins/bitcoin");
  });

  it("adds query string when present", (): void => {
    const url = toURL("https://api.coingecko.com/api/", "coins/bitcoin", { a: "1", b: "2" });
    // Order is deterministic if you pre-sort keys, but allow either order here:
    expect(
      url === "https://api.coingecko.com/api/coins/bitcoin?a=1&b=2" ||
        url === "https://api.coingecko.com/api/coins/bitcoin?b=2&a=1",
    ).toBe(true);
  });

  it("omits query when empty", (): void => {
    const url = toURL("https://api.coingecko.com/api", "simple/price", {});
    expect(url).toBe("https://api.coingecko.com/api/simple/price");
  });
});
