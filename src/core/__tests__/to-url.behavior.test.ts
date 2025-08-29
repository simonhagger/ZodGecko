import { describe, it, expect } from "vitest";

import { toURL } from "../../runtime/url.js";
import { formatPath, joinBaseAndPath } from "../index.js";

describe("runtime/url", () => {
  it("toURL joins path and injects query", () => {
    const u = toURL("https://api.coingecko.com/api/v3", "/coins/bitcoin", { page: 2 });
    expect(u.href).toContain("/coins/bitcoin");
    expect(u.href).toMatch(/[?&]page=2\b/);
  });

  it("absolute URL bypasses base and merges query", () => {
    const u = toURL("https://api.coingecko.com/api/v3", "https://example.com/x", { page: 2 });
    expect(u.href.startsWith("https://example.com/x")).toBe(true);
    expect(u.href).toMatch(/[?&]page=2\b/);
  });

  it("normalizes leading/trailing slashes", () => {
    const u1 = toURL("https://api.coingecko.com/api/v3/", "ping", {});
    const u2 = toURL("https://api.coingecko.com/api/v3", "/ping", {});
    expect(u1.href).toBe("https://api.coingecko.com/api/v3/ping");
    expect(u2.href).toBe("https://api.coingecko.com/api/v3/ping");
  });

  it("formatPath works for template paths", () => {
    const p = formatPath("/coins/{id}/tickers", { id: "bitcoin" });
    expect(p).toBe("/coins/bitcoin/tickers");
  });

  it("joinBaseAndPath composes safely", () => {
    const href = joinBaseAndPath("https://api.coingecko.com/api/v3", "/ping");
    expect(href).toBe("https://api.coingecko.com/api/v3/ping");
  });
});
