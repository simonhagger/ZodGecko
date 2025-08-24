/**
 * @file Functional tests for Indexes — /indexes/list.
 * @summary Asserts the no-param route serializes to {}.
 * @remarks
 * Route covered:
 * - GET /indexes/list
 * @see ./docs/indexes.functional.testing.md
 */
import { describe, it, expect } from "vitest";
import type { z } from "zod";

import { indexes, buildQuery } from "../../../index.js";
import { expectValid } from "../_utils/index.js";

type ListReqIn = z.input<typeof indexes.schemas.IndexesListRequestSchema>;

describe("indexes.list – functional", () => {
  it("{} → {}", () => {
    const req: ListReqIn = {};
    expectValid(indexes.schemas.IndexesListRequestSchema, req);
    expect(buildQuery("/indexes/list", req)).toEqual({});
  });
});
