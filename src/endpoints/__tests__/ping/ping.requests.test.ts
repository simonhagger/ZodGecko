/**
 * @file Request schema tests for the Ping API.
 * @summary Validates strict no-param requests.
 * @remarks
 * Routes covered:
 * - GET /ping
 * @see ./docs/ping.functional.testing.md
 */

import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { ping, buildQuery } from "../../../index.js";
import { expectValid, expectInvalid } from "../_utils/index.js";

type PingReqIn = z.input<typeof ping.schemas.PingRequestSchema>;

describe("ping.requests", () => {
  it("/ping → {} is valid and serializes to {}", () => {
    const req: PingReqIn = {};
    expectValid(ping.schemas.PingRequestSchema, req);
    expect(buildQuery("/ping", req)).toEqual({});
  });

  it("/ping rejects unknown keys", () => {
    expectInvalid(ping.schemas.PingRequestSchema, { extra: true });
  });
});
