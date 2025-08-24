/**
 * @file Request schema tests for the Global API.
 * @summary Validates strict no-param requests.
 * @remarks
 * Routes covered:
 * - GET /global
 * - GET /global/decentralized_finance_defi
 * @see ./docs/global.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { global as globalNs, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

type GlobalReqIn = z.input<typeof globalNs.schemas.GlobalRequestSchema>;
type DefiReqIn = z.input<typeof globalNs.schemas.GlobalDefiRequestSchema>;

describe("global.requests", () => {
  it("/global → {} is valid and serializes to {}", () => {
    const req: GlobalReqIn = {};
    expectValid(globalNs.schemas.GlobalRequestSchema, req);
    expect(buildQuery("/global", req)).toEqual({});
  });

  it("/global rejects unknown keys", () => {
    expectInvalid(globalNs.schemas.GlobalRequestSchema, { extra: true });
  });

  it("/global/decentralized_finance_defi → {} is valid and serializes to {}", () => {
    const req: DefiReqIn = {};
    expectValid(globalNs.schemas.GlobalDefiRequestSchema, req);
    expect(buildQuery("/global/decentralized_finance_defi", req)).toEqual({});
  });

  it("/global/decentralized_finance_defi rejects unknown keys", () => {
    expectInvalid(globalNs.schemas.GlobalDefiRequestSchema, { nope: 1 });
  });
});
