# ZodGecko

Type-safe CoinGecko v3 models powered by \[Zod].
Validate requests & responses at runtime, infer types at compile time, and serialize queries that “just work”.

> **Status:** pre-1.0 **beta** — expect changes between betas.

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

Fetch markets with type-safe params + runtime-validated response:

```ts
import { coins } from "zodgecko";
import { buildQuery } from "zodgecko/runtime";

// 1) Type-safe params (throws if invalid)
const req = coins.schemas.MarketsRequestSchema.parse({
  vs_currency: "usd",
  ids: ["bitcoin", "ethereum"],
});

// 2) Serialize query (arrays → stable CSV, booleans → "true"/"false",
//    numbers → strings, empties dropped, documented server defaults dropped)
const qs = new URLSearchParams(buildQuery("/coins/markets", req)).toString();

const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${qs}`);
const data = coins.schemas.MarketsResponseSchema.parse(await res.json());
//    ^ runtime-validated, fully typed
```

---

## Why ZodGecko?

- **Runtime validation**: catch API changes and bad inputs immediately.
- **Type inference**: TS types come from schemas, no duplication.
- **Smart query builder**: dedup/sort CSVs, normalize values, **drop server defaults**.
- **Small surface**: ESM, tree-shakable endpoint groups.

---

## Common recipes

### 1) Coin detail (drop path param from query)

```ts
import { coins } from "zodgecko";
import { buildQuery, formatPath } from "zodgecko/runtime";

const path = formatPath("/coins/{id}", { id: "bitcoin" });
const req = coins.schemas.CoinDetailRequestSchema.parse({
  localization: false, // default is true → kept as "false"
});
// remove path params from query object (nothing to drop here, shown for pattern)
const qs = new URLSearchParams(buildQuery("/coins/{id}", req)).toString();

const res = await fetch(`https://api.coingecko.com/api/v3${path}?${qs}`);
const body = coins.schemas.CoinDetailResponseSchema.parse(await res.json());
```

### 2) Token price by platform (with path + arrays)

```ts
import { simple } from "zodgecko";
import { buildQuery, formatPath } from "zodgecko/runtime";

const path = formatPath("/simple/token_price/{id}", { id: "ethereum" });
const req = simple.schemas.SimpleTokenPriceRequestSchema.parse({
  contract_addresses: [
    "0x0000000000000000000000000000000000000000",
    "0x1111111111111111111111111111111111111111",
  ],
  vs_currencies: ["usd", "eur"],
  include_market_cap: true,
});

const qs = new URLSearchParams(buildQuery("/simple/token_price/{id}", req)).toString();
const res = await fetch(`https://api.coingecko.com/api/v3${path}?${qs}`);
const data = simple.schemas.SimpleTokenPriceResponseSchema.parse(await res.json());
```

### 3) Friendlier errors

```ts
import { explainZodError } from "zodgecko/runtime";
import { coins } from "zodgecko";

const parsed = coins.schemas.MarketsRequestSchema.safeParse({ vs_currency: 123 });
if (!parsed.success) {
  console.error(explainZodError(parsed.error)); // neat, readable messages
}
```

---

## Supported endpoints (high level)

- **asset-platforms**, **categories**, **coins** (detail, list, markets, tickers, history, ohlc, market_chart, market_chart/range)
- **companies**, **contract** (by platform + subroutes), **derivatives** (incl. exchanges), **exchanges**
- **global**, **indexes**, **ping**, **search**, **simple**

Each endpoint group exports a `schemas` object for **requests** and **responses**.

> Full details & per-endpoint notes: see the repo.

---

## Runtime helpers

From `zodgecko/runtime`:

- `buildQuery(path, params)` → normalized query object (CSV/booleans/numbers/default-dropping)
- `formatPath("/coins/{id}", { id: "bitcoin" })` → `"/coins/bitcoin"`
- `toURL(base, path, params)` / `qsString(path, params)` → convenience compilers
- `withDefaults(path, partial)` → fill **missing** fields with documented server defaults
- `explainZodError(error)` → readable Zod error messages

---

## TypeScript tips

Use schema input types for request literals:

```ts
import type { z } from "zod";
import { coins } from "zodgecko";

type MarketsIn = z.input<typeof coins.schemas.MarketsRequestSchema>;
const req: MarketsIn = { vs_currency: "usd" }; // TS checks before runtime parse
```

---

## Versioning

- Betas are published with `--tag beta` (e.g. `0.1.2-beta.0`).
- Breaking changes can occur between betas. Stable 1.0 will follow SemVer.

---

## Links

- **GitHub (docs & issues):** search “zodgecko” on GitHub
- **Testing guide:** see `TESTING.md` in the repo
- **Contributing:** see `CONTRIBUTING.md`
