import { describe, it, expect } from "vitest";

import type { CoinsByIdHistoryRequest } from "../../endpoints/coins/requests.js";
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

describe("runtime/validate.ts", () => {
  const EP = "/coins/{id}/history" as const;

  describe("types & guards", () => {
    it("request schema rejects when required query missing", () => {
      expect(validateRequest(EP, { id: "bitcoin" } as CoinsByIdHistoryRequest).ok).toBe(false);
    });
  });

  describe("happy path", () => {
    it("validateRequest success", () => {
      expect(validateRequest(EP, { id: "bitcoin", date: "30-12-2024" }).ok).toBe(true);
    });
  });

  describe("error handling", () => {
    it("validateResponse fails on incompatible shape (anchors required)", () => {
      const bad = validateResponse(EP, { totally: "wrong" });
      expect(bad.ok).toEqual(false);
    });
  });
});
