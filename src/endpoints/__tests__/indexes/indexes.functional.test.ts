/**
 * @file Functional tests for Indexes — /indexes.
 * @summary Verifies pagination normalization (numbers→strings).
 * @remarks
 * Route covered:
 * - GET /indexes
 * @see ./docs/indexes.functional.testing.md
 */
import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { indexes, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type IndexesReqIn = z.input<typeof indexes.schemas.IndexesRequestSchema>;

describe("indexes – functional", () => {
  it("serializes numeric pagination to strings", () => {
    const req: IndexesReqIn = { per_page: 25, page: 3 };
    expectValid(indexes.schemas.IndexesRequestSchema, req);
    expect(buildQuery("/indexes", req)).toEqual({ per_page: "25", page: "3" });
  });
});
