import { describe, it, expect } from "vitest";
import { z } from "zod";

import {
  safeParseRequest,
  explainZodError,
  toUnixSeconds,
  ddmmyyyy,
  normalizeCoinId,
  normalizeVsCurrencies,
} from "../../core/parse-utils.js";

describe("core/parse-utils", () => {
  it("safeParseRequest returns typed data or formatted message", () => {
    const S = z.object({ vs_currency: z.string() });
    const ok = safeParseRequest(S, { vs_currency: "usd" });
    expect(ok.ok).toBe(true);

    const bad = safeParseRequest(S, { nope: true });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.message).toContain("vs_currency");
    }
  });

  it("explainZodError generates human messages", () => {
    const S = z.object({ id: z.string().min(1) });
    const res = S.safeParse({ id: "" });
    if (!res.success) {
      const msg = explainZodError(res.error, { compact: true });
      expect(msg).toContain("id");
    }
  });

  it("toUnixSeconds handles date, number, and strings", () => {
    const n1 = toUnixSeconds(new Date("2024-05-01T00:00:00Z"));
    const n2 = toUnixSeconds(1714521600);
    const n3 = toUnixSeconds("1714521600");
    expect(n1).toBe(1714521600);
    expect(n2).toBe(1714521600);
    expect(n3).toBe(1714521600);
  });

  it("ddmmyyyy formats a UTC date", () => {
    expect(ddmmyyyy("2024-12-24T00:00:00Z")).toBe("24-12-2024");
  });

  it("normalizeCoinId and normalizeVsCurrencies", () => {
    expect(normalizeCoinId("  Bitcoin  ")).toBe("bitcoin");
    expect(normalizeVsCurrencies(["USD", "eur", "usd", "  GBP "])).toEqual(["eur", "gbp", "usd"]);
    expect(normalizeVsCurrencies("usd, EUR ,usd")).toEqual(["eur", "usd"]);
  });
});
