/**
 * @file Response schema tests for the Ping API.
 * @summary Parses fixture and proves unknown-field tolerance (inline payload).
 * @remarks
 * Routes covered:
 * - GET /ping
 * @see ./docs/ping.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import fixture from "./fixtures/ping.response.json" with { type: "json" };
import { ping } from "../../../index.js";
import { isObjectRecord } from "../_utils/index.js";

const HasGeckoSays = z.object({ gecko_says: z.string().min(1) });

describe("ping.responses (fixtures)", () => {
  it("parses /ping fixture; essentials validate", () => {
    const parsed = ping.schemas.PingResponseSchema.parse(fixture as unknown);
    expect(HasGeckoSays.safeParse(parsed).success).toBe(true);
  });
});

describe("ping.responses (tolerance)", () => {
  it("preserves unknown fields (inline payload)", () => {
    const payload: unknown = { gecko_says: "(V3) To the Moon!", some_future_field: { ok: true } };
    const parsed = ping.schemas.PingResponseSchema.parse(payload);

    const rec = parsed as Record<string, unknown>;
    expect(
      isObjectRecord(rec) && Object.prototype.hasOwnProperty.call(rec, "some_future_field"),
    ).toBe(true);
  });
});
