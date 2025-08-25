/**
 * @file Functional tests for Exchanges — /exchanges/{id}/volume_chart.
 * @summary Verifies numeric days→string and path param dropping.
 * @remarks
 * Route covered:
 * - GET /exchanges/{id}/volume_chart
 * - Pattern: drop {id} before buildQuery; numbers serialize to strings.
 * @see ./docs/exchanges.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { exchanges, buildQuery } from "../../../index.js";
import { dropId, expectValid } from "../_utils/index.js";

type VolReqIn = z.input<typeof exchanges.schemas.ExchangesByIdVolumeChartRequestSchema>;

describe("exchanges.volume_chart – functional", () => {
  it("serializes days (number→string) and drops path id", () => {
    const req: VolReqIn = { id: "binance", days: 30 };
    expectValid(exchanges.schemas.ExchangesByIdVolumeChartRequestSchema, req);

    const q = dropId(req);
    expect(buildQuery("/exchanges/{id}/volume_chart", q)).toEqual({
      days: "30",
    });
  });
});
