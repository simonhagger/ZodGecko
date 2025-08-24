/**
 * @file Functional tests for Simple — /simple/token_price/{id}.
 * @summary Ensures `{id}` is dropped and inputs normalize/serialize correctly.
 * @remarks
 * Route covered:
 * - GET /simple/token_price/{id}
 * @see ./docs/simple.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { simple, buildQuery } from "../../../index.js";
import { dropId } from "../_utils/index.js";

type TokenPriceReqIn = z.input<typeof simple.schemas.SimpleTokenPriceRequestSchema>;

describe("simple.token_price – functional", () => {
  it('drops path id; arrays→CSV; booleans→"true"/"false"', () => {
    const req: TokenPriceReqIn = {
      id: "ethereum",
      contract_addresses: [
        "0x0000000000000000000000000000000000000000",
        "0x1111111111111111111111111111111111111111",
      ],
      vs_currencies: ["usd", "eur"],
      include_market_cap: false,
      include_24hr_vol: true,
      include_24hr_change: true,
      include_last_updated_at: false,
    };
    const parsed = simple.schemas.SimpleTokenPriceRequestSchema.parse(req);
    const q = dropId(parsed);
    expect(buildQuery("/simple/token_price/{id}", q)).toEqual({
      contract_addresses:
        "0x0000000000000000000000000000000000000000,0x1111111111111111111111111111111111111111",
      vs_currencies: "eur,usd",
      include_24hr_vol: "true",
      include_24hr_change: "true",
      precision: "2",
    });
  });
});
