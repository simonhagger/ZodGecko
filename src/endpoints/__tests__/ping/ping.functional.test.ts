/**
 * @file Functional tests for Ping — /ping.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /ping
 * - Pattern: {} → {}
 * @see ./docs/ping.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { ping, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type PingReqIn = z.input<typeof ping.schemas.PingRequestSchema>;

describe("ping – functional", () => {
  it("empty request stays empty in the query string", () => {
    const req: PingReqIn = {};
    expectValid(ping.schemas.PingRequestSchema, req);
    expect(buildQuery("/ping", req)).toEqual({});
  });
});
