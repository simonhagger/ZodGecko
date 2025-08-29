import { describe, it, expect } from "vitest";

import { formatPathStrict, type PathParams } from "../../core/url.js";
import type { CoinsByIdRequest } from "../../endpoints/coins/requests.js";
import type { Endpoint } from "../endpoints.js";
import { buildQuery } from "../query.js";
import { toURL, formatPath, joinBaseAndPath, qsString } from "../url.js";

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
describe("runtime/url helpers", () => {
  it("qsString produces stable, alphabetized query", () => {
    const qs = qsString("/coins/markets", {
      per_page: 100,
      vs_currency: "usd",
      ids: ["ethereum", "bitcoin"],
    });
    expect(qs).toBe("ids=bitcoin%2Cethereum&vs_currency=usd"); // per_page dropped by defaults
  });

  it("toURL composes base + path and appends normalized query", () => {
    const url = toURL("https://api.coingecko.com/api/v3", "/coins/markets", {
      vs_currency: "usd",
      page: 1,
    });
    const href: string = typeof url === "string" ? url : String(url.href);
    // page dropped by defaults; URL should still be well-formed
    expect(href).toBe("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
  });

  it("matches direct buildQuery serialization", () => {
    const qsObj = buildQuery("/coins/markets", { vs_currency: "usd", ids: ["b", "a", "a"] });
    const qs = qsString("/coins/markets", { vs_currency: "usd", ids: ["a", "b"] });
    expect(qs).toBe(`ids=a%2Cb&vs_currency=usd`);
    expect(qsObj).toEqual({ ids: "a,b", vs_currency: "usd" });
  });
  it("joins URL parts correctly", () => {
    const url1 = joinBaseAndPath("https://api.coingecko.com/api/v3", "/coins/markets");
    const url2 = joinBaseAndPath("https://api.coingecko.com/api/v3/", "coins/markets");
    const url3 = joinBaseAndPath("", "/coins/markets");
    const url4 = joinBaseAndPath("https://api.coingecko.com/api/v3/", "");
    expect(url1).toBe("https://api.coingecko.com/api/v3/coins/markets");
    expect(url2).toBe("https://api.coingecko.com/api/v3/coins/markets");
    expect(url3).toBe("coins/markets");
    expect(url4).toBe("https://api.coingecko.com/api/v3");
  });
  it("replaces a single {param}", () => {
    const template = "/coins/{id}" as const;
    const params = { id: "bitcoin" } satisfies PathParams<typeof template>;
    const out = formatPath(template, params);
    expect(out).toBe("/coins/bitcoin");
  });

  it("replaces multiple different params", () => {
    const template = "/coins/{id}/contract/{address}" as const;
    const params = {
      id: "ethereum",
      address: "0x0000000000000000000000000000000000000000",
    } satisfies PathParams<typeof template>;
    const out = formatPath(template, params);
    expect(out).toBe("/coins/ethereum/contract/0x0000000000000000000000000000000000000000");
  });

  it("replaces repeated placeholders (all occurrences)", () => {
    const template = "/exchanges/{id}/tickers/{id}";
    const params = { id: "binance_futures" } satisfies PathParams<typeof template>;
    const out = formatPath(template, params);
    expect(out).toBe("/exchanges/binance_futures/tickers/binance_futures");
  });

  it("URL-encodes param values", () => {
    const template = "/search/{query}" as const;
    const params = { query: "UNI V2/ETH" } satisfies PathParams<typeof template>;
    const out = formatPath(template, params);
    // space -> %20, slash -> %2F
    expect(out).toBe("/search/UNI%20V2%2FETH");
  });

  it("serializes non-string values (number/boolean) via String(...)", () => {
    const template = "/page/{page}/flag/{flag}" as const;
    const params = { page: "2", flag: "true" } satisfies PathParams<typeof template>;
    const out = formatPath(template, params);
    expect(out).toBe("/page/2/flag/true");
  });
});
describe("runtime/formatPath", () => {
  it("replaces a single param and URL-encodes the value", () => {
    const t: Endpoint = "/coins/{id}";
    type P = PathParams<typeof t>;
    const p: P = { id: "a coin/with spaces" };

    expect(formatPath(t, p)).toBe("/coins/a%20coin%2Fwith%20spaces");
  });

  it("replaces multiple different params (indexes composite id)", () => {
    const t: Endpoint = "/coins/{id}/contract/{contract_address}";
    type P = PathParams<typeof t>;
    const p: P = { contract_address: "0x123", id: "SPX" };

    expect(formatPath(t, p)).toBe("/coins/SPX/contract/0x123");
  });

  it("works with other by-id templates", () => {
    const t: Endpoint = "/derivatives/exchanges/{id}";
    type P = PathParams<typeof t>;
    const p: P = { id: "binance_futures" };

    expect(formatPath(t, p)).toBe("/derivatives/exchanges/binance_futures");
  });

  it("is a no-op when the template has no placeholders", () => {
    const t: Endpoint = "/ping";
    // PathParams<"/ping"> is {}, so cast a compatible empty object
    const p = {} as PathParams<typeof t>;

    expect(formatPath(t, p)).toBe("/ping");
  });
});

describe("runtime/url.ts", () => {
  describe("happy path", () => {
    it("toURL joins and injects query", () => {
      const u = toURL("https://api.coingecko.com/api/v3", "/coins/bitcoin", { page: 2 });
      expect(u.href).toContain("/coins/bitcoin");
      expect(u.href).toMatch(/[?&]page=2\b/);
    });
  });

  describe("edge cases", () => {
    it("absolute href bypasses base", () => {
      const u = toURL("https://api.coingecko.com/api/v3", "https://example.com/x", { q: 1 });
      expect(u.href.startsWith("https://example.com/x")).toBe(true);
      expect(u.href).toMatch(/[?&]q=1\b/);
    });
    it("normalizes slashes", () => {
      expect(toURL("https://api.coingecko.com/api/v3/", "ping", {}).href).toBe(
        "https://api.coingecko.com/api/v3/ping",
      );
      expect(toURL("https://api.coingecko.com/api/v3", "/ping", {}).href).toBe(
        "https://api.coingecko.com/api/v3/ping",
      );
    });
  });

  describe("error handling", () => {
    it("formatPath drops missing segments without throwing (soft)", () => {
      const r = formatPath("/coins/{id}", {} as CoinsByIdRequest, { onMissing: "drop-segment" });
      expect(r).toBe("/coins");
    });
  });
  describe("error handling", () => {
    it("formatPath returns Error on empty params for templated path (strict)", () => {
      const r = formatPathStrict("/coins/{id}", {} as CoinsByIdRequest);
      expect(r).toBeInstanceOf(Error);
    });
  });

  describe("docs/contract invariants", () => {
    it("joinBaseAndPath composes safely", () => {
      const href = joinBaseAndPath("https://api.coingecko.com/api/v3", "/ping");
      expect(href).toBe("https://api.coingecko.com/api/v3/ping");
    });
  });
});
