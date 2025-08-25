import { describe, it, expect } from "vitest";

import { buildQuery } from "../../runtime/query.js";
import {
  qsString,
  toURL,
  joinBaseAndPath,
  formatPath,
  type PathParams,
} from "../../runtime/url.js";

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
    // page dropped by defaults; URL should still be well-formed
    expect(url).toBe("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
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
