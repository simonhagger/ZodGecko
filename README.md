# ZodGecko

Type-safe CoinGecko v3 models powered by [Zod]. ZodGecko gives you:

- **Runtime validation** for requests & responses
- **Type inference** (TS) straight from the schemas
- A tiny **query builder** that normalizes values and **drops server defaults**
- Clean **ESM**, **Node 18+**, tree-shakable subpath exports

> **Status:** pre-1.0 **beta**. Expect sharp edges and incremental breaking changes while coverage expands.

---

## Install

```bash
npm i zodgecko zod
# or
pnpm add zodgecko zod
```

**Requirements**

- Node **>= 18**
- ESM only (no CJS)
- Peer dep: `zod` **^3.25** or **^4** (either is supported)

---

## Quick start

```ts
import { coins } from "zodgecko";
import { buildQuery } from "zodgecko/runtime";

// 1) Validate + infer request types using Zod schemas
const req = coins.schemas.MarketsRequestSchema.parse({
  vs_currency: "usd",
  ids: ["bitcoin", "ethereum"],
});

// 2) Serialize query (stable CSV, drops defaults like per_page=100/page=1/order=market_cap_desc)
const qs = new URLSearchParams(buildQuery("/coins/markets", req)).toString();
// -> "ids=bitcoin%2Cethereum&vs_currency=usd"

// 3) Fetch + validate the response at runtime
const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${qs}`);
const data = coins.schemas.MarketsResponseSchema.parse(await res.json());
```

### What `buildQuery` does

- Arrays → **deduped, sorted CSV** (`["b","a","a"]` → `"a,b"`)
- Booleans → `"true" | "false"`
- Numbers → strings; **drops non-finite** (`NaN`, `±Infinity`)
- **Drops empties** (empty arrays/strings/whitespace) & **unknown types**
- **Drops documented server defaults** per endpoint (e.g. markets `per_page=100`, `page=1`, etc.)

If an endpoint has **no defaults**, `buildQuery` keeps everything (after normalization).

---

## Endpoints covered

- `asset-platforms`
- `categories`
- `coins` (detail, list, markets, tickers, history, ohlc, market_chart, market_chart/range)
- `companies`
- `contract` (by id + ERC20 subroutes)
- `derivatives` (+ exchanges subroutes)
- `exchanges`
- `global`
- `indexes`
- `ping`
- `search`
- `simple`
- `status_updates`

Each group exposes:

- **`schemas`** – Zod request/response schemas
- **Types** – inferred from schemas in `requests.ts` / `responses.ts`

Import from the **package root** for endpoint namespaces, and from **`zodgecko/runtime`** for runtime utilities.

---

## API surface

```ts
// Endpoint namespaces (exported at the root)
import { coins, exchanges, simple /* ... */ } from "zodgecko";

// Runtime helpers
import { buildQuery, serverDefaults } from "zodgecko/runtime";

// Low-level building blocks (if you need them)
import * as core from "zodgecko/core"; // tolerantObject, CSList, primitives, etc.
```

> `serverDefaults` is a reference table that `buildQuery` uses to know which values to drop for each path.

---

## Error handling tips

- Use `.parse(...)` to throw on invalid data, or `.safeParse(...)` if you prefer a result object.
- Response schemas are intentionally **tolerant**: unknown fields are allowed so upstream additions don’t break you.

---

## Testing & quality

- Full Vitest suite with 100% coverage across runtime logic and schemas
- Per-endpoint **functional test docs** under `src/endpoints/**/docs/*.functional.testing.md`
- A central **TESTING.md** explains the test layout, helpers, and fixtures

Run locally:

```bash
npm run typecheck
npm run lint
npm run test:coverage
```

---

## Versioning & stability

- Pre-1.0 **beta** builds use `--tag beta`. Breaking changes may occur between betas.
- Once stable, we’ll follow **SemVer**.

---

## Contributing

PRs welcome! Please run `typecheck`, `lint`, and the **full test suite** before opening. See **CONTRIBUTING.md** for guidelines.

---

## License

MIT — see **LICENSE**.

## Note

To produce an holistic overview of this repository there is an MS Windows PowerShell script that can be run with:

```powershell
.\Export-Project.ps1 -OutputFile "project-dump-$(Get-Date -Format yyyyMMdd-HHmm).txt"
```
