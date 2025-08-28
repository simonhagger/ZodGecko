# ZodGecko

![npm version](https://img.shields.io/npm/v/zodgecko?color=brightgreen&label=npm) ![license](https://img.shields.io/github/license/simonhagger/ZodGecko) ![build](https://img.shields.io/github/actions/workflow/status/simonhagger/ZodGecko/ci.yml?branch=main)

Type-safe CoinGecko v3 models powered by \[Zod].
Validate requests & responses at runtime, infer types at compile time, and serialize queries that “just work”.

> **Status:** pre-1.0 **beta** — expect changes between betas.
>
> ⚠️ This is a part-time hobby project with best-endeavours support. It does not yet cover all endpoints (e.g. NFT endpoints are not yet implemented), but the goal is to cover all free endpoints by the time we exit beta. Paid endpoints are not covered. We’d be happy to expand coverage to paid endpoints if CoinGecko provided sponsorship with a paid API key.

---

## Install

```bash
npm i zodgecko zod
# or
pnpm add zodgecko zod
```

**Requirements:** Node 18+, ESM only.

---

## Quickstart

Fetch OHLC data with type-safe params and runtime-validated response:

```ts
import { getSchemas, formatPath, toURL, DEFAULT_BASE } from "zodgecko";

// NOTE: DEFAULT_BASE is set to the CoinGecko v3 API base URL
//   "https://api.coingecko.com/api/v3"
// This constant is tied to the API definition ZodGecko is coded against.
// You can override or omit it if you want to point at a proxy, mock server,
// or a future API version (e.g. when CoinGecko releases v4).

// 1) Derive request/response schemas for an endpoint
const { req, res } = getSchemas("/coins/{id}/ohlc");
// => req: Zod schema for request body, res: Zod schema for response body

// 2) Parse & validate request params
const parsed = req.parse({ id: "bitcoin", vs_currency: "usd", days: 1 });
// => parsed = { id: "bitcoin", vs_currency: "usd", days: 1 }

// 3) Build a safe path from the template + params
const path = formatPath("/coins/{id}/ohlc", parsed);
// => path = "/coins/bitcoin/ohlc"

// 4) Build a full URL with normalized query string
const url = toURL(DEFAULT_BASE, path, parsed);
// => url = "https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=1"

// 5) Fetch & validate the response
const data = res.parse(await (await fetch(url)).json());
// => data: fully typed, runtime-validated response object
```

---

## Why ZodGecko?

- **Runtime validation**: catch API changes and bad inputs immediately.
- **Type inference**: TS types come from schemas, no duplication.
- **Smart query builder**: dedup/sort arrays to CSV (comma-separated values like `ids=bitcoin,ethereum`), normalize values, **drop server defaults to reduce redundancy**.
- **Unified access**: `getSchemas(endpoint)` gives you both request & response schemas.
- **Deterministic URLs**: helpers always produce stable, sorted query strings → better cache hits and reproducible requests.
- **Safer URL building**: path helpers encode and validate values so you don’t accidentally build broken URLs.

---

## Common recipes

### 1) Coin detail (drop path param from query)

```ts
import { getSchemas, formatPath, toURL, DEFAULT_BASE } from "zodgecko";

// Step 1: derive schemas
const { req, res } = getSchemas("/coins/{id}");
// => req: schema for coin detail request, res: schema for response

// Step 2: validate request params
const parsed = req.parse({ id: "bitcoin", localization: false });
// => parsed = { id: "bitcoin", localization: false }

// Step 3: build path
const path = formatPath("/coins/{id}", parsed);
// => "/coins/bitcoin"

// Step 4: build full URL
const url = toURL(DEFAULT_BASE, path, parsed);
// => "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false"

// Step 5: fetch + validate response
const data = res.parse(await (await fetch(url)).json());
// => typed coin detail response object
```

### 2) Token price by platform (with path + arrays)

```ts
import { getSchemas, formatPath, toURL, DEFAULT_BASE } from "zodgecko";

// Step 1: derive schemas
const { req, res } = getSchemas("/simple/token_price/{id}");

// Step 2: validate params (arrays handled → CSV)
const parsed = req.parse({
  id: "ethereum",
  contract_addresses: [
    "0x0000000000000000000000000000000000000000",
    "0x1111111111111111111111111111111111111111",
  ],
  vs_currencies: ["usd", "eur"],
  include_market_cap: true,
});
// => contract_addresses: "0x0000...,0x1111..." (CSV)
// => vs_currencies: "eur,usd" (sorted CSV)

// Step 3: build path
const path = formatPath("/simple/token_price/{id}", parsed);
// => "/simple/token_price/ethereum"

// Step 4: build full URL
const url = toURL(DEFAULT_BASE, path, parsed);
// => "https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x0000...,0x1111...&include_market_cap=true&vs_currencies=eur,usd"

// Step 5: fetch + validate response
const data = res.parse(await (await fetch(url)).json());
// => typed token price response
```

### 3) Friendlier errors

```ts
import { explainZodError } from "zodgecko/core";
import { getSchemas } from "zodgecko";

// Step 1: derive schema
const { req } = getSchemas("/coins/markets");

// Step 2: safe parse invalid data
const parsed = req.safeParse({ vs_currency: 123 });
if (!parsed.success) {
  console.error(explainZodError(parsed.error));
  // => neat, human-readable error messages
}
```

---

## Supported endpoints (high level)

- **asset-platforms**, **categories**, **coins** (detail, list, markets, tickers, history, ohlc, market_chart, market_chart/range)
- **companies**, **contract** (by platform + subroutes), **derivatives** (incl. exchanges), **exchanges**
- **global**, **ping**, **search**, **simple**

> Each endpoint path string can be passed to `getSchemas(endpoint)` to get the request & response Zod schemas.

---

## Runtime helpers

From `zodgecko/runtime`:

- `getSchemas(endpoint)` → **why**: single entrypoint to access request/response schemas by endpoint string.
- `buildQuery(path, params)` → **why**: normalizes booleans, numbers, dates, and arrays into deterministic forms; arrays become CSV (comma-separated values). Drops documented server defaults so your URLs stay minimal and cache-friendly.
- `formatPath(template, params)` → **why**: safely URL-encodes path params, trims, and rejects invalid types. Prevents broken or ambiguous URLs.
- `toURL(base, path, params)` → **why**: composes base + path + query, sorts keys alphabetically → reproducible request URLs.
- `qsString(path, params)` → **why**: generates a canonical query string (e.g. for logging, signing, or testing cache determinism).
- `withDefaults(path, partial)` → **why**: fill **missing** fields with server defaults, letting you construct valid minimal requests.
- `explainZodError(error)` (from `zodgecko/core`) → **why**: produces human-readable error messages from Zod errors.

---

## TypeScript tips

Use schema input types for request literals:

```ts
import type { z } from "zod";
import { getSchemas } from "zodgecko";

// Step 1: derive schema
const { req } = getSchemas("/coins/markets");

// Step 2: build TS type from schema
// z.input<typeof req> infers the expected input type for the request

type MarketsIn = z.input<typeof req>;

// Step 3: use the type to build a safe object
const params: MarketsIn = { vs_currency: "usd" }; // TS checks before runtime parse
```

---

## Versioning

- Betas are published with `--tag beta` (e.g. `0.1.2-beta.0`).
- Breaking changes can occur between betas. Stable 1.0 will follow SemVer.

---

## Links

- **GitHub (docs & issues):** [https://github.com/simonhagger/ZodGecko](https://github.com/simonhagger/ZodGecko)
