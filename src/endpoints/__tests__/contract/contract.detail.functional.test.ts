/**
 * @file src/endpoints/__tests__/contract/contract.detail.functional.test.ts
 * @module tests/contract/detail
 * @endpoint GET /coins/{id}/contract/{contract_address}
 * @summary Functional behavior for contract detail; drops path params before serialization.
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { contract, buildQuery } from "../../../index.js";
import { expectValid, dropPathParamsTyped } from "../_utils/index.js";

// If your schema is named differently, adjust this alias:
type DetailIn = z.input<typeof contract.schemas.CoinsByIdContractByAddressRequestSchema>;

describe("contract.detail – functional", () => {
  it("has no query params; path params dropped", () => {
    const req: DetailIn = {
      id: "ethereum",
      contract_address: "0x0000000000000000000000000000000000000000",
    };
    expectValid(contract.schemas.CoinsByIdContractByAddressRequestSchema, req);

    const q = dropPathParamsTyped(req, ["id", "contract_address"] as const);
    expect(buildQuery("/coins/{id}/contract/{contract_address}", q)).toEqual({});
  });
});
