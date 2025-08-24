/**
 * @file Response schema tests for the Simple API.
 * @summary Parses fixtures and proves tolerance to unknown fields where applicable.
 * @remarks
 * Routes covered:
 * - GET /simple/price
 * - GET /simple/token_price/{id}
 * - GET /simple/supported_vs_currencies
 * @see ./docs/simple.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import priceFx from "./fixtures/simple.price.response.json" with { type: "json" };
import vsFx from "./fixtures/simple.supported-vs-currencies.response.json" with { type: "json" };
import tokenFx from "./fixtures/simple.token-price.response.json" with { type: "json" };
import { simple } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

// tiny guards (avoid unsafe member access on unknown)
const PriceRowHasUsd = z.object({ usd: z.number() });
const TokenRowHasUsd = z.object({ usd: z.number() });

describe("simple.responses (fixtures)", () => {
  it("parses /simple/price fixture", () => {
    const parsed = simple.schemas.SimplePriceResponseSchema.parse(priceFx as unknown);
    expect(isObjectRecord(parsed)).toBe(true);
    // e.g. { bitcoin: { usd: 123 } }
    const firstKey = Object.keys(parsed)[0];
    expect(PriceRowHasUsd.safeParse((parsed as Record<string, unknown>)[firstKey]).success).toBe(
      true,
    );
  });

  it("parses /simple/token_price/{id} fixture", () => {
    const parsed = simple.schemas.SimpleTokenPriceResponseSchema.parse(tokenFx as unknown);
    expect(isObjectRecord(parsed)).toBe(true);
    const firstKey = Object.keys(parsed)[0];
    expect(TokenRowHasUsd.safeParse((parsed as Record<string, unknown>)[firstKey]).success).toBe(
      true,
    );
  });

  it("parses /simple/supported_vs_currencies fixture", () => {
    const parsed = simple.schemas.SupportedVsCurrenciesResponseSchema.parse(vsFx as unknown);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(typeof parsed[0]).toBe("string");
  });
});
