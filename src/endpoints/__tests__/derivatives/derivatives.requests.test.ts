/**
 * @file Request schema tests for the Derivatives API.
 * @summary Validates enum + pagination inputs and strict no-param routes.
 * @remarks
 * Routes covered:
 * - GET /derivatives
 * - GET /derivatives/exchanges
 * - GET /derivatives/exchanges/list
 * - GET /derivatives/exchanges/{id}
 * @see ./docs/derivatives.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { derivatives, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid, dropId } from "../_utils/index.js";

type ListReqIn = z.input<typeof derivatives.schemas.DerivativesRequestSchema>;
type ExReqIn = z.input<typeof derivatives.schemas.DerivativesExchangesRequestSchema>;
type ExListReqIn = z.input<typeof derivatives.schemas.DerivativesExchangesListRequestSchema>;
type ByIdReqIn = z.input<typeof derivatives.schemas.DerivativesExchangeByIdRequestSchema>;

describe("derivatives.requests", () => {
  // /derivatives
  it("/derivatives → {} is valid and serializes to {}", () => {
    const req: ListReqIn = {};
    expectValid(derivatives.schemas.DerivativesRequestSchema, req);
    expect(buildQuery("/derivatives", req)).toEqual({});
  });

  it("/derivatives rejects unknown keys", () => {
    const bad: unknown = { foo: "bar" };
    expectInvalid(derivatives.schemas.DerivativesRequestSchema, bad);
  });

  // /derivatives/exchanges
  it("/derivatives/exchanges accepts enum order + numeric paging", () => {
    const req: ExReqIn = { order: "name_asc", per_page: 50, page: 2 };
    expectValid(derivatives.schemas.DerivativesExchangesRequestSchema, req);
  });

  it("/derivatives/exchanges rejects invalid enum and wrong types", () => {
    const badEnum: unknown = { order: "definitely_not_valid", per_page: 50, page: 1 };
    const badTypes: unknown = { order: "name_asc", per_page: "50", page: "2" };
    expectInvalid(derivatives.schemas.DerivativesExchangesRequestSchema, badEnum);
    expectInvalid(derivatives.schemas.DerivativesExchangesRequestSchema, badTypes);
  });

  // /derivatives/exchanges/list
  it("/derivatives/exchanges/list → {} is valid and serializes to {}", () => {
    const req: ExListReqIn = {};
    expectValid(derivatives.schemas.DerivativesExchangesListRequestSchema, req);
    expect(buildQuery("/derivatives/exchanges/list", req)).toEqual({});
  });

  it("/derivatives/exchanges/list rejects unknown keys", () => {
    const bad: unknown = { extra: true };
    expectInvalid(derivatives.schemas.DerivativesExchangesListRequestSchema, bad);
  });

  // /derivatives/exchanges/{id}
  it("/derivatives/exchanges/{id} requires id; id is not serialized", () => {
    const req: ByIdReqIn = { id: "binance_futures" };
    expectValid(derivatives.schemas.DerivativesExchangeByIdRequestSchema, req);

    const q = dropId(req);
    expect(buildQuery("/derivatives/exchanges/{id}", q)).toEqual({});
  });

  it("/derivatives/exchanges/{id} rejects missing id", () => {
    const bad: unknown = {};
    expectInvalid(derivatives.schemas.DerivativesExchangeByIdRequestSchema, bad);
  });
});
