/**
 * @file Sanity functional tests for the Exchanges API.
 * @summary Guards empty-query serialization and path-param dropping for representative routes.
 * @remarks
 * Routes covered:
 * - GET /exchanges
 * - GET /exchanges/list
 * - GET /exchanges/{id}
 * - Note: default-dropping assertions live in route-specific tests if needed.
 * @see ./docs/exchanges.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { buildQuery } from "../../../index.js";
import { dropId } from "../_utils/index.js";

describe("exchanges – sanity", () => {
  it("/exchanges → {}", () => {
    expect(buildQuery("/exchanges", {})).toEqual({});
  });

  it("/exchanges/list → {}", () => {
    expect(buildQuery("/exchanges/list", {})).toEqual({});
  });

  it("/exchanges/{id} → drops path param", () => {
    const q = dropId({ id: "kraken" } as const);
    expect(buildQuery("/exchanges/{id}", q)).toEqual({});
  });

  it("/exchanges/{id}/tickers → drops id, others allowed", () => {
    const { id: _omit, ...q } = { id: "kraken", page: 2, include_exchange_logo: true } as const;
    void _omit;
    expect(buildQuery("/exchanges/{id}/tickers", q)).toEqual({
      page: "2",
      include_exchange_logo: "true",
    });
  });

  it("/exchanges/{id}/volume_chart → drops id; days becomes string", () => {
    const { id: _drop, ...q } = { id: "kraken", days: 7 } as const;
    void _drop;
    expect(buildQuery("/exchanges/{id}/volume_chart", q)).toEqual({ days: "7" });
  });
});
