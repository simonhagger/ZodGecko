/**
 * @file Response schema tests for the Coins API.
 * @summary Parses fixtures across coins routes and proves tolerance to unknown fields.
 * @remarks
 * Routes referenced (examples):
 * - /coins/markets, /coins/{id}, /coins/{id}/tickers, /coins/{id}/ohlc
 * - Style: fixtures for happy-path; inline payloads for tolerance.
 * @see ./docs/coins.functional.testing.md
 */

import fixture from "./fixtures/markets.response.json" with { type: "json" };
import { coins } from "../../../index.js";

describe("coins.responses", () => {
  it("parses /coins/markets payload (tolerant to unknown fields)", () => {
    // Clone the fixture and inject an unknown field in the first row
    const withUnknown = structuredClone(fixture);
    // @ts-expect-error not in the declared schema, but present at runtime
    withUnknown[0] = { ...withUnknown[0], some_future_field: { hello: "world" } };

    const data = coins.schemas.MarketsResponseSchema.parse(withUnknown);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const row = data[0];
    expect(row).toHaveProperty("id");
    expect(row).toHaveProperty("symbol");
    expect(row).toHaveProperty("name");
    expect(row).toHaveProperty("current_price");

    // unknown extra field should survive due to catchall
    // @ts-expect-error not in the declared schema, but present at runtime
    expect(row.some_future_field).toBeDefined();
  });
});
