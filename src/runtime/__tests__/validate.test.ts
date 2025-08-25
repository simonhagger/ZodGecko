import { describe, it, expect } from "vitest";

import { getSchemas } from "../../runtime/endpoints.js"; // ⬅️ from runtime, not root
import { validateRequest, validateResponse } from "../../runtime/validate.js"; // ⬅️ from runtime, not root

describe("runtime/validate", () => {
  it("resolves schemas for a known endpoint", () => {
    const s = getSchemas("/coins/markets");
    expect(typeof s.req.parse).toBe("function");
    expect(typeof s.res.parse).toBe("function");
  });

  it("validateRequest drops path params when asked", () => {
    const vr = validateRequest(
      "/coins/{id}/tickers",
      { id: "bitcoin", page: 2 },
      { dropPathParams: true },
    );
    expect(vr.ok).toBe(true);
    if (vr.ok) {
      // page default is 1, so "2" should serialize; id should not be present
      expect(Object.prototype.hasOwnProperty.call(vr.data as object, "id")).toBe(false);
    }
  });

  it("validateResponse parses tolerant shapes", () => {
    const resp = {
      tickers: [{ base: "BTC", target: "USD", market: { name: "Binance" }, future_field: 1 }],
    };
    const vr = validateResponse("/coins/{id}/tickers", resp);
    expect(vr.ok).toBe(true);
  });
});
