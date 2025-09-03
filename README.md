# ZodGecko

![npm version](https://img.shields.io/npm/v/zodgecko?color=brightgreen&label=npm) ![license](https://img.shields.io/github/license/simonhagger/ZodGecko) ![build](https://img.shields.io/github/actions/workflow/status/simonhagger/ZodGecko/ci.yml?branch=main)

Type-safe CoinGecko v3 models powered by \[Zod].
Validate requests & responses at runtime, infer types at compile time, and serialize queries that “just work”.

> **Status:** pre-1.0 **beta** — expect changes between betas.
> ⚠️ This is a part-time hobby project with best-efforts support.

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

Build a typed client for CoinGecko v3, generate requests with defaults, and fetch safely:

```ts
import { createClient } from "zodgecko/client";

// 1) Create a typed client for the version/plan you target
const client = createClient("v3.0.1/public");

// 2) Discover request surface (placeholders + server defaults)
const surface = client.getRequestFor("coins.by-id.ohlc", {
  includeUndefinedOptionals: true,
  fillServerDefaults: true,
});

// 3) Fill required params
const req = {
  path: { id: "bitcoin" },
  query: { ...surface.query, vs_currency: "usd", days: "1" },
};

// 4) Build deterministic URL
const url = client.url("coins.by-id.ohlc", req);
// => "https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=1"

// 5) (Optional) Use the minimal fetch client
// import { createFetchClient } from "zodgecko/fetch";
// const fc = createFetchClient("v3.0.1/public");
// const data = await fc.get("coins.by-id.ohlc", req);
```

---

## Why ZodGecko?

- **Runtime validation**: catch API changes and bad inputs immediately.
- **Type inference**: TS types come from schemas, no duplication.
- **Smart query builder**: dedupe/sort arrays to CSV, normalize values, drop server defaults.
- **Unified access**: `getSchemas(id)` gives you request & response schemas.
- **Deterministic URLs**: helpers always produce stable, sorted query strings.
- **Safe path building**: `formatPath` encodes and validates placeholders.

---

## Common recipes

### Coin detail

```ts
import { createClient } from "zodgecko/client";

const client = createClient("v3.0.1/public");

const shape = client.getRequestFor("coins.by-id", {
  includeUndefinedOptionals: true,
  fillServerDefaults: true,
});

const req = { path: { id: "bitcoin" }, query: { ...shape.query, localization: false } };
const url = client.url("coins.by-id", req);
// => "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false"
```

### Token price by platform

```ts
import { createClient } from "zodgecko/client";

const client = createClient("v3.0.1/public");

const shape = client.getRequestFor("simple.token_price.by-id");

const req = {
  path: { id: "ethereum" },
  query: {
    ...shape.query,
    contract_addresses: [
      "0x0000000000000000000000000000000000000000",
      "0x1111111111111111111111111111111111111111",
    ],
    vs_currencies: ["usd", "eur"],
    include_market_cap: true,
  },
};

const url = client.url("simple.token_price.by-id", req);
```

### Friendlier errors

```ts
import { parseRequest } from "zodgecko";
import { explainError } from "zodgecko";

try {
  parseRequest("coins.markets", { query: { vs_currency: 123 } });
} catch (e) {
  console.error(explainError(e));
}
```

---

## Supported endpoints

- **asset-platforms**, **categories**, **coins** (detail, list, markets, tickers, history, ohlc, market_chart, market_chart/range)
- **companies**, **contract** (by platform + subroutes), **derivatives**, **exchanges**
- **global**, **ping**, **search**, **simple**

> Endpoints are referenced by **id** (e.g. `coins.by-id.ohlc`).

---

## Public helpers

From `zodgecko`:

- `formatParams`, `formatParamsForEndpoint`
- `formatPath`
- `getSchemas`, `getRequestFor`
- `parseRequest`, `parseResponse`
- `toURL`
- `explainError`

From `zodgecko/fetch`:

- `createFetchClient` → minimal fetch client on top of `fetch`

---

## TypeScript tips

```ts
import type { z } from "zod";
import { getSchemas } from "zodgecko";

const { requestSchema } = getSchemas("coins.markets");
type MarketsIn = z.input<typeof requestSchema>;

const params: MarketsIn = { vs_currency: "usd" }; // TS checks before runtime
```

---

## Versioning

- Betas are published with `--tag beta` (e.g. `0.1.2-beta.0`).
- Breaking changes can occur between betas. Stable 1.0 will follow SemVer.

---

## Links

- **GitHub (docs & issues):** [https://github.com/simonhagger/ZodGecko](https://github.com/simonhagger/ZodGecko)
