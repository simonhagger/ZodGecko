import { describe, expect, it } from "vitest";

import { getRequestFor } from "../get-request-for.js";

describe("getRequestFor", () => {
  it("populates required path params with empty strings and exposes pathTemplate", (): void => {
    const req = getRequestFor("/coins/{id}");
    expect(req.pathTemplate).toBe("/coins/{id}");
    expect(req.path).toEqual({ id: "" });
  });

  it("when includeUndefinedOptionals=true and fillServerDefaults=false, shows query keys as blanks", (): void => {
    const req = getRequestFor("/coins/{id}", {
      includeUndefinedOptionals: true,
      fillServerDefaults: false,
    });
    // includes all declared query keys, but blank (dropped later by formatParams)
    expect(req.query).toMatchObject({
      localization: "",
      tickers: "",
      market_data: "",
      community_data: "",
      developer_data: "",
      sparkline: "",
    });
  });

  it("when fillServerDefaults=true, fills query with server defaults", (): void => {
    const req = getRequestFor("/coins/{id}", {
      includeUndefinedOptionals: false,
      fillServerDefaults: true,
    });
    // defaults per registry for coins.by-id
    expect(req.query).toMatchObject({
      localization: true,
      tickers: true,
      market_data: true,
      community_data: true,
      developer_data: true,
      sparkline: false,
    });
    // no undefined-optionals added
    expect(Object.keys(req.query as Record<string, unknown>).length).toBe(6);
  });

  it("/simple/price: omitDefaultedFields prunes defaults, keeps placeholders", () => {
    const req = getRequestFor("/simple/price", {
      includeUndefinedOptionals: true,
      fillServerDefaults: true,
      omitDefaultedFields: true,
    });

    // server-defaulted keys must be pruned
    expect(req.query).not.toHaveProperty("include_tokens");
    expect(req.query).not.toHaveProperty("include_market_cap");
    expect(req.query).not.toHaveProperty("include_24hr_vol");
    expect(req.query).not.toHaveProperty("include_24hr_change");
    expect(req.query).not.toHaveProperty("include_last_updated_at");

    // required + optionals (without defaults) remain as placeholders
    expect(req.query).toMatchObject({
      vs_currencies: "",
      ids: "",
      names: "",
      symbols: "",
      precision: "",
    });
  });

  it("simple.price with defaults but keep optionals present", () => {
    const req = getRequestFor("/simple/price", {
      includeUndefinedOptionals: true,
      fillServerDefaults: true,
    });

    // defaults are applied
    expect(req.query).toMatchObject({
      include_tokens: "top",
      include_market_cap: false,
      include_24hr_vol: false,
      include_24hr_change: false,
      include_last_updated_at: false,
    });

    // required stays as placeholder (no default), other non-defaulted keys too
    expect(req.query).toMatchObject({
      vs_currencies: "",
      ids: "",
      names: "",
      symbols: "",
      precision: "",
    });
  });

  it("unknown endpoint returns empty path/query and undefined template", (): void => {
    const req = getRequestFor("does.not.exist");
    expect(req.pathTemplate).toBeUndefined();
    expect(req.path).toEqual({});
    expect(req.query).toEqual({});
  });
});
