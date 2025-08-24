/**
 * @file Request schema tests for the Simple API.
 * @summary Validates CSV/array inputs, booleans, and strict no-param routes.
 * @remarks
 * Routes covered (examples):
 * - GET /simple/price
 * - GET /simple/token_price/{id}
 * - GET /simple/supported_vs_currencies
 * @see ./docs/simple.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { simple, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid, dropId } from "../_utils/index.js";

// Aliases for schema *inputs* (not outputs).
type PriceReqIn = z.input<typeof simple.schemas.SimplePriceRequestSchema>;
type TokenPriceReqIn = z.input<typeof simple.schemas.SimpleTokenPriceRequestSchema>;
type VsReqIn = z.input<typeof simple.schemas.SupportedVsCurrenciesRequestSchema>;

describe("simple.requests", () => {
  it("GET /simple/price: arrays → CSV; booleans serialize", () => {
    const req: PriceReqIn = {
      ids: ["ethereum", "bitcoin", "bitcoin"],
      vs_currencies: ["usd", "eur"],
      include_market_cap: true,
      include_24hr_vol: true,
      include_24hr_change: false, // differs from `true` → keep as "false"
      include_last_updated_at: true,
    };
    const parsed = simple.schemas.SimplePriceRequestSchema.parse(req);
    expect(buildQuery("/simple/price", parsed)).toEqual({
      ids: "bitcoin,ethereum",
      vs_currencies: "eur,usd",
      include_market_cap: "true",
      include_24hr_vol: "true",
      precision: "2",
      include_last_updated_at: "true",
    });
  });

  it("GET /simple/price: rejects empty ids / vs_currencies", () => {
    expectInvalid(simple.schemas.SimplePriceRequestSchema, {
      ids: [],
      vs_currencies: ["usd"],
    });
    expectInvalid(simple.schemas.SimplePriceRequestSchema, {
      ids: ["bitcoin"],
      vs_currencies: [],
    });
  });

  it("GET /simple/token_price/{id}: drops path id; arrays→CSV", () => {
    const req: TokenPriceReqIn = {
      id: "ethereum", // path param
      contract_addresses: [
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        "0x1111111111111111111111111111111111111111",
      ],
      vs_currencies: ["usd", "eur"],
      include_market_cap: true,
      include_24hr_vol: false,
      include_24hr_change: true,
      include_last_updated_at: false,
    };
    const parsed = simple.schemas.SimpleTokenPriceRequestSchema.parse(req);
    const q = dropId(parsed);
    expect(buildQuery("/simple/token_price/{id}", q)).toEqual({
      contract_addresses:
        "0x0000000000000000000000000000000000000000,0x1111111111111111111111111111111111111111",
      vs_currencies: "eur,usd",
      include_market_cap: "true",
      include_24hr_change: "true",
      precision: "2",
    });
  });

  it("GET /simple/supported_vs_currencies: no params", () => {
    const req: VsReqIn = {};
    expectValid(simple.schemas.SupportedVsCurrenciesRequestSchema, req);
    expect(buildQuery("/simple/supported_vs_currencies", req)).toEqual({});
  });
});
