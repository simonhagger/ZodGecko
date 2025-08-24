/**
 * @file Sanity functional tests for the Coins API — Contract routes.
 * @summary Guards empty-query serialization and absence of server defaults.
 * @remarks
 * Routes covered:
 * - GET /coins/{id}/contract/{contract_address}
 * - GET /coins/{id}/contract/{contract_address}/market_chart
 * - GET /coins/{id}/contract/{contract_address}/market_chart/range
 * @see ./docs/contract.functional.testing.md
 */

import { describe, it, expect } from "vitest";

import { serverDefaults, buildQuery } from "../../../index.js";
import { expectNoDefaultsAndEmptyQuery } from "../_utils/index.js";

describe("contract – sanity", () => {
  it("/coins/{id}/contract/{contract_address}", () => {
    expectNoDefaultsAndEmptyQuery("/coins/{id}/contract/{contract_address}");
  });

  it("/coins/{id}/contract/{contract_address}/market_chart", () => {
    expect(serverDefaults["/coins/{id}/contract/{contract_address}/market_chart"]).toBeUndefined();
    expect(buildQuery("/coins/{id}/contract/{contract_address}/market_chart", {})).toEqual({});
  });

  it("/coins/{id}/contract/{contract_address}/market_chart/range", () => {
    expect(
      serverDefaults["/coins/{id}/contract/{contract_address}/market_chart/range"],
    ).toBeUndefined();
    expect(buildQuery("/coins/{id}/contract/{contract_address}/market_chart/range", {})).toEqual(
      {},
    );
  });
});
