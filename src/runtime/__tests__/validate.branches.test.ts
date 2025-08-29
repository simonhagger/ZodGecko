import { describe, it, expect } from "vitest";

import { validateRequest, validateResponse } from "../index.js";

describe("runtime/validate branches", () => {
  const EP = "/coins/{id}/history" as const;
  // const { req, res } = getSchemas(EP);

  it("validateRequest: success", () => {
    const result = validateRequest(EP, { id: "bitcoin", date: "30-12-2024" });
    expect(result.ok).toBe(true);
  });

  it("validateRequest: failure includes issues", () => {
    const bad = validateRequest(EP, { id: "bitcoin" });
    expect(bad.ok).toEqual(false);
    if (bad.ok === false) {
      expect(bad.error?.issues?.length).toBeGreaterThan(0);
    }
  });

  it("validateResponse: success with minimal shape", () => {
    // Adjust this to a minimal acceptable payload for the endpoint's response schema
    const sample = { id: "bitcoin", symbol: "btc", name: "Bitcoin" };
    const result = validateResponse(EP, sample);
    expect(result.ok).toEqual(true);
  });

  it("validateResponse: failure on incompatible shape", () => {
    const bad = validateResponse(EP, { totally: "wrong" });
    console.log(`validateResponse: ${JSON.stringify(bad)}`);
    expect(bad.ok).toEqual(false);
  });
});
