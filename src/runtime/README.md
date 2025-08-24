# Runtime

Utilities for **serializing request objects to query strings** and handling **server defaults**.

Public API:

- `buildQuery(path: string, params: Record<string, unknown>): Record<string, string>`
- `serverDefaults` (read-only map used by `buildQuery`)

```ts
import { buildQuery, serverDefaults } from "zodgecko/runtime";
```

---

## What `buildQuery` does

Given an endpoint path (e.g. `"/coins/markets"`) and a **validated** request object, it returns a **normalized query object** suitable for `URLSearchParams`.

Normalization rules:

- **Arrays → CSV**: deduped & sorted.
  `["ethereum","bitcoin","ethereum"] → "bitcoin,ethereum"`
- **Booleans → strings**: `"true"` / `"false"`.
- **Numbers → strings**; **non-finite** (`NaN`, `±Infinity`) are **dropped**.
- **Empty values dropped**: `""`, whitespace-only strings, empty arrays, `null`, `undefined`.
- **Unsupported types dropped**: objects/functions are removed.
- **Server defaults dropped**: if the endpoint has a documented default in `serverDefaults` and the value equals it → **omit** from the query.

> `buildQuery` does **not** validate shapes; pass objects that already conform to the endpoint’s Zod request schema.

### Example — drops defaults

```ts
const query = buildQuery("/coins/markets", {
  vs_currency: "usd",
  per_page: 100, // documented default → dropped
  page: 1, // default → dropped
  order: "market_cap_desc", // default → dropped
  ids: ["ethereum", "bitcoin"], // sorted CSV
});
// => { ids: "bitcoin,ethereum", vs_currency: "usd" }
```

### Example — endpoint with **no defaults**

```ts
const q = buildQuery("/asset_platforms", {});
// => {}  (nothing to drop)
```

### Path parameters

`buildQuery` serializes **query** only. If a route uses path params (e.g. `"/coins/{id}/tickers"`), **remove** them before calling:

```ts
const { id: _id, ...q } = { id: "bitcoin", page: 2 } as const;
void _id; // avoid unused variable warning
buildQuery("/coins/{id}/tickers", q);
// => { page: "2" }
```

(Our tests use a small helper `dropId(...)` for this pattern; that helper lives in tests, not in the runtime package.)

---

## `serverDefaults`

A central list of **documented** server defaults keyed by endpoint path. `buildQuery` consults this map to decide what to drop.

- Keep the list **small** and only include defaults that CoinGecko documents.
- Do **not** encode defaults inside request schemas—runtime handles dropping.

Example (illustrative shape):

```ts
export const serverDefaults = {
  "/coins/markets": {
    per_page: 100,
    page: 1,
    order: "market_cap_desc",
    sparkline: false,
    locale: "en",
  },
  "/status_updates": {
    per_page: 100,
    page: 1,
  },
  // ...
} as const;
```

When you add or change an endpoint’s defaults, update `server-defaults.ts` and adjust tests if needed.

---

## Usage with `fetch`

```ts
import { coins } from "zodgecko";
import { buildQuery } from "zodgecko/runtime";

const req = coins.schemas.MarketsRequestSchema.parse({
  vs_currency: "usd",
  ids: ["bitcoin", "ethereum"],
});

const qs = new URLSearchParams(buildQuery("/coins/markets", req)).toString();
const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${qs}`);
const data = coins.schemas.MarketsResponseSchema.parse(await res.json());
```

---

## Testing

- Runtime behavior (CSV, booleans, number handling, dropping empties/unknowns/defaults) is covered by the `runtime` test suite.
- Endpoint-specific expectations (e.g. which keys are defaults, which arrays become CSV) are covered by each endpoint’s **functional tests**.

See **TESTING.md** for:

- folder layout,
- helpers (e.g. `dropId` used in tests),
- and patterns for request/response/functional/sanity tests.

---

## Out of scope (for runtime)

- No Zod schemas (those live under each `endpoints/<group>/schemas.ts`).
- No HTTP client code.
- No endpoint-specific business logic beyond well-documented default lists.
