import { describe, it, expect } from "vitest";
// import { ZodObject, ZodType } from "zod";

import {
  AssetPlatformsRequestSchema,
  AssetPlatformsResponseSchema,
} from "../../endpoints/asset_platforms/schemas.js";
import { getRequestSchema, getResponseSchema, getSchemas } from "../index.js";

describe("runtime/endpoints: unknown endpoint behavior", () => {
  it("allows you to get just a request schema", () => {
    expect(getRequestSchema("/asset_platforms")).toBe(AssetPlatformsRequestSchema);
  });
  it("allows you to get just a response schema", () => {
    expect(getResponseSchema("/asset_platforms")).toBe(AssetPlatformsResponseSchema);
  });
  it("allows you to get both schemas", () => {
    expect(getSchemas("/asset_platforms")).toEqual({
      req: AssetPlatformsRequestSchema,
      res: AssetPlatformsResponseSchema,
    });
  });
});
