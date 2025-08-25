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

import { describe, it } from "vitest";

import { expectNoDefaultsAndEmptyQuery } from "../_utils/test-helpers.js";

describe("contract – sanity", () => {
  it("/coins/{id}/contract/{contract_address}/market_chart → no defaults; {} → {}", () => {
    expectNoDefaultsAndEmptyQuery("/coins/{id}/contract/{contract_address}/market_chart");
  });

  it("/coins/{id}/contract/{contract_address}/market_chart/range → no defaults; {} → {}", () => {
    expectNoDefaultsAndEmptyQuery("/coins/{id}/contract/{contract_address}/market_chart/range");
  });
});
