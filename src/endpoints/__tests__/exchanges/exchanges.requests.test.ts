/**
 * @file Request schema tests for the Exchanges API.
 * @summary Validates enum + pagination inputs and strict no-param routes.
 * @remarks
 * Routes covered (examples):
 * - GET /exchanges
 * - GET /exchanges/list
 * - GET /exchanges/{id}
 * - GET /exchanges/{id}/tickers
 * - GET /exchanges/{id}/status_updates
 * @see ./docs/exchanges.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { exchanges, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid, dropId } from "../_utils/index.js";

/** Convenience aliases for schema *inputs* (not outputs). */
type ExchangesReqIn = z.input<typeof exchanges.schemas.ExchangesRequestSchema>;
type ExchangesListReqIn = z.input<typeof exchanges.schemas.ExchangesListRequestSchema>;
type ExchangeByIdReqIn = z.input<typeof exchanges.schemas.ExchangesByIdRequestSchema>;
type ExchangeTickersReqIn = z.input<typeof exchanges.schemas.ExchangesByIdTickersRequestSchema>;
type ExchangeVolumeChartReqIn = z.input<
  typeof exchanges.schemas.ExchangesByIdVolumeChartRequestSchema
>;

describe("exchanges.requests", () => {
  it("GET /exchanges: pagination accepted; numbers→strings in query", () => {
    const req: ExchangesReqIn = { per_page: 50, page: 2 };
    const parsed = exchanges.schemas.ExchangesRequestSchema.parse(req);
    expect(buildQuery("/exchanges", parsed)).toEqual({ per_page: "50", page: "2" });
  });

  it("GET /exchanges: rejects invalid pagination", () => {
    expectInvalid(exchanges.schemas.ExchangesRequestSchema, { per_page: 0, page: -1 });
  });

  it("GET /exchanges/list: no params", () => {
    const req: ExchangesListReqIn = {};
    expectValid(exchanges.schemas.ExchangesListRequestSchema, req);
    expect(buildQuery("/exchanges/list", req)).toEqual({});
  });

  it("GET /exchanges/{id}: id is path-only (drop before serialize)", () => {
    const req: ExchangeByIdReqIn = { id: "binance" };
    const q = dropId(req);
    expect(buildQuery("/exchanges/{id}", q)).toEqual({});
  });

  it("GET /exchanges/{id}/tickers: CSV + paging + booleans; keep order", () => {
    const req: ExchangeTickersReqIn = {
      id: "binance",
      coin_ids: ["eth", "btc", "eth"],
      page: 3,
      include_exchange_logo: true,
      order: "trust_score_desc", // no server-default here → keep
    };
    const q = dropId(exchanges.schemas.ExchangesByIdTickersRequestSchema.parse(req));
    expect(buildQuery("/exchanges/{id}/tickers", q)).toEqual({
      coin_ids: "btc,eth",
      include_exchange_logo: "true",
      order: "trust_score_desc",
      page: "3",
    });
  });

  it("GET /exchanges/{id}/volume_chart: days numeric → string; id dropped", () => {
    const req: ExchangeVolumeChartReqIn = { id: "kraken", days: 7 };
    const q = dropId(exchanges.schemas.ExchangesByIdVolumeChartRequestSchema.parse(req));
    expect(buildQuery("/exchanges/{id}/volume_chart", q)).toEqual({ days: "7" });
  });
});
