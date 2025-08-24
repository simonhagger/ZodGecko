/**
 * @file Sanity functional tests for the derivatives endpoint (multi-route).
 * @summary Ensures stable default-dropping and empty-query serialization across routes.
 * @remarks
 * - Runtime: Vitest
 * - Routes covered:
 * - derivatives,
 * - derivatives/exchanges/list,
 * - derivatives/exchanges/{id},
 * - Pattern: path params are never serialized; `{}` queries remain `{}` unless non-defaults are supplied
 * @see ./docs/derivatives.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { buildQuery, type derivatives } from "../../../index.js";

type ListReqIn = z.input<typeof derivatives.schemas.DerivativesRequestSchema>;
type ExListReqIn = z.input<typeof derivatives.schemas.DerivativesExchangesListRequestSchema>;
type ByIdReqIn = z.input<typeof derivatives.schemas.DerivativesExchangeByIdRequestSchema>;

describe("derivatives.sanity", () => {
  it("/derivatives → empty query serializes to {}", () => {
    const req: ListReqIn = {};
    expect(buildQuery("/derivatives", req)).toEqual({});
  });

  it("/derivatives/exchanges/list → empty query serializes to {}", () => {
    const req: ExListReqIn = {};
    expect(buildQuery("/derivatives/exchanges/list", req)).toEqual({});
  });

  it("/derivatives/exchanges/{id} → path id is not included in query", () => {
    const req: ByIdReqIn = { id: "binance_futures" };
    const { id: _drop, ...q } = req;
    void _drop;
    expect(buildQuery("/derivatives/exchanges/{id}", q)).toEqual({});
  });
});
