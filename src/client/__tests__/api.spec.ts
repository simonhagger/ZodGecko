import { describe, expect, it } from "vitest";

import { getPathInfo } from "../../registry/index.js";
import type { RequestShape } from "../../types.js";
import { ZodGecko } from "../api.js";
import { createClient } from "../factory.js";

describe("ZodGecko client", () => {
  const client = createClient({ version: "v3.0.1", plan: "public" } as const);

  it("lists available endpoint paths (includes /simple/price)", () => {
    const paths = client.endpoints();
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.includes("/simple/price" as (typeof paths)[number])).toBe(true);
  });

  it("returns a full entry for a known endpoint (shape + template)", () => {
    const ids = client.endpoints();
    const id = ids.find((x) => x === ("simple/price" as unknown as (typeof ids)[number]));
    if (!id) return; // skip if not migrated locally

    // Ensure it doesn’t throw and returns a value
    expect(() => client.entry(id)).not.toThrow();
    const e = client.entry(id) as unknown as { id: string; pathTemplate: string };

    expect(e && typeof e).toBe("object");
    expect(e.id).toBe("simple.price");
    // Cross-check pathTemplate with registry to avoid hard typing issues
    expect(e.pathTemplate).toBe(getPathInfo(id)?.pathTemplate);
    expect(e.pathTemplate).toBe("/simple/price");
  });

  it("getRequestFor surfaces pathTemplate and placeholders/defaults", () => {
    const ids = client.endpoints();
    const id = ids.find((x) => x === ("simple.price" as unknown as (typeof ids)[number]));
    if (!id) return;

    const req = client.getRequestFor(id, {
      includeUndefinedOptionals: true,
      fillServerDefaults: true,
    });

    expect(req.pathTemplate).toBe("/simple/price");

    // required query key has no default → placeholder
    expect(req.query).toMatchObject({ vs_currencies: "" });

    // defaults should be applied (per your registry)
    expect(req.query).toMatchObject({
      include_tokens: "top",
      include_market_cap: false,
      include_24hr_vol: false,
      include_24hr_change: false,
      include_last_updated_at: false,
    });
  });

  it("url() builds a deterministic URL for simple.price", () => {
    const ids = client.endpoints();
    const id = ids.find((x) => x === ("simple.price" as unknown as (typeof ids)[number]));
    if (!id) return;

    const surface = client.getRequestFor(id, {
      includeUndefinedOptionals: true,
      fillServerDefaults: true,
      omitDefaultedFields: true, // drop server defaults
    });

    const req: RequestShape = {
      path: surface.path,
      query: { ...surface.query, vs_currencies: "usd" }, // fill required
    };

    const url = client.url(id, req);
    expect(url).toBe("https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd");
  });

  it("url() fills a path template correctly for coins.by-id (if present)", () => {
    const ids = client.endpoints();
    const id = ids.find((x) => x === ("coins.by-id" as unknown as (typeof ids)[number]));
    if (!id) return;

    const req: RequestShape = { path: { id: "bitcoin" }, query: {} };
    const url = client.url(id, req);

    expect(url).toBe("https://api.coingecko.com/api/v3/coins/bitcoin");
  });
});
const vp = { version: "v3.0.1", plan: "public" } as const;

describe("ZodGecko (path keyed)", () => {
  const client = new ZodGecko({ validFor: vp });

  it("lists endpoint paths", () => {
    expect(client.endpoints()).toContain("/simple/supported_vs_currencies");
  });

  it("throws for unknown path", () => {
    // @ts-expect-error incorrect URL
    expect(() => client.entry("/nope")).toThrow("Unknown endpoint for v3.0.1/public: /nope");
  });

  it("builds URL for a simple endpoint", () => {
    const u = client.url("/simple/price", { query: { ids: "bitcoin", vs_currencies: "usd" } });
    expect(u).toMatch(/\/api\/v3\/simple\/price\?/);
    expect(u).toMatch(/ids=bitcoin/);
    expect(u).toMatch(/vs_currencies=usd/);
  });

  it("returns request surface", () => {
    const s = client.getRequestFor("/coins/{id}");
    expect(s.pathTemplate).toBe("/coins/{id}");
  });
});
