// examples/basic-usage.ts
import { createClient } from "../src/client/factory.js";
import { explainError } from "../src/helpers/explain-error.js";
import { parseResponse } from "../src/helpers/parse-response.js";
import type { RequestShape } from "../src/types/api.js";

// Simple header builder (works for public & paid)
function buildHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey && apiKey.trim()) headers["x-cg-pro-api-key"] = apiKey.trim();
  return headers;
}

async function main(): Promise<void> {
  // Pick version/plan (defaults to public v3.0.1)
  const VERSION_PLAN = (process.env.CG_VERSION_PLAN ?? "v3.0.1/public") as
    | "v3.0.1/public"
    | "v3.1.1/paid";

  const BASE = process.env.COINGECKO_API_BASE ?? "https://api.coingecko.com/api/v3";
  const API_KEY = process.env.COINGECKO_API_KEY; // only needed for paid

  const client = createClient(VERSION_PLAN, { baseURL: BASE });

  // --- Example 1: /simple/price?vs_currencies=usd&ids=bitcoin ---

  // Derive the id from the client so it's typed correctly (no 'never')
  const ids = client.endpoints();
  const simplePrice = ids.find((x) => x === ("simple.price" as unknown as (typeof ids)[number]));
  if (!simplePrice) {
    console.log("simple.price not present in this registry — skipping");
  } else {
    const surf1 = client.getRequestFor(simplePrice, {
      includeUndefinedOptionals: true,
      fillServerDefaults: true,
      omitDefaultedFields: true,
    });

    const req1: RequestShape = {
      path: surf1.path,
      // fill required query
      query: { ...surf1.query, vs_currencies: "usd", ids: "bitcoin" },
    };

    const url1 = client.url(simplePrice, req1);
    console.log("GET", url1);

    try {
      const res = await fetch(url1, { headers: buildHeaders(API_KEY) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as unknown;
      const data = parseResponse(simplePrice, json);
      console.log("simple.price OK →", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("simple.price ERR →", explainError(e));
    }
  }

  // --- Example 2: /coins/{id} (path templating) ---
  // only run if that endpoint exists in your current registry

  const coinsById = ids.find((x) => x === ("coins.by-id" as unknown as (typeof ids)[number]));
  if (coinsById) {
    const surf2 = client.getRequestFor(coinsById, {
      includeUndefinedOptionals: true,
      fillServerDefaults: true,
      omitDefaultedFields: true,
    });

    const req2: RequestShape = {
      path: { ...surf2.path, id: "bitcoin" }, // fill required path param
      query: surf2.query,
    };

    const url2 = client.url(coinsById, req2);
    console.log("GET", url2);

    try {
      const res = await fetch(url2, { headers: buildHeaders(API_KEY) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as unknown;
      const data = parseResponse(coinsById, json);
      console.log("coins.by-id OK →", typeof data, "(validated)");
      console.log(`Data: ${JSON.stringify(data)}`);
    } catch (e) {
      console.error("coins.by-id ERR →", explainError(e));
    }
  } else {
    console.log("coins.by-id not present in registry yet — skipping");
  }
}

main().catch((e) => {
  console.error("Fatal:", explainError(e));
  process.exit(1);
});
