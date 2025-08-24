# Runtime

Helpers for **normalizing request parameters** and managing endpoint defaults before sending them to the CoinGecko API.

This layer has two responsibilities:

1. Convert validated request objects into canonical **query strings**.
2. Centralize **server default values** so requests can safely omit redundant parameters.

> Runtime is intentionally **stateless** and does not depend on any endpoint schemas.  
> It operates on plain objects validated by Zod.

---

## Modules

### `query.ts`

```ts
import { buildQuery } from "@zodgecko";
```

#### `buildQuery(endpoint: string, params: Record<string, unknown>): Record<string, string>`

- Converts a request object into a **query string**.
- Normalizes arrays into **stable, deduped, sorted CSVs** (via `CSList`).
- Drops parameters if their value matches a documented **server default** (see [`server-defaults.ts`](./server-defaults.ts)).
- Ensures **alphabetized query strings** for caching and deduplication.

**Example:**

```ts
import { buildQuery } from "zodgecko";

const qs = buildQuery("/coins/markets", {
  vs_currency: "usd",
  order: "market_cap_desc", // default
  per_page: 100, // default
  page: 1, // default
});

console.log(qs);
// → "vs_currency=usd"
```

Here, `order`, `per_page`, and `page` are stripped because they match defaults.

---

### `server-defaults.ts`

```ts
import { serverDefaults } from "zodgecko";
```

#### `serverDefaults: Record<string, Record<string, unknown>>`

A central map of **endpoint → default query parameters**.

- Keeps requests **lean** (removes redundant params).
- Ensures cache keys are **consistent** across clients.
- Provides a single source of truth for testing & spec alignment.

**Example:**

```ts
serverDefaults["/coins/markets"];
// {
//   per_page: 100,
//   page: 1,
//   order: "market_cap_desc",
//   locale: "en",
//   sparkline: false,
// }
```

---

## Adding or Updating Defaults

1. Check the [CoinGecko API docs](https://www.coingecko.com/api/documentation).
2. Add or update the entry in [`server-defaults.ts`](./server-defaults.ts).
3. Verify `buildQuery` strips those params.
4. Add or update tests to confirm behavior.

---

## Design Notes

- **Requests remain strict**: defaults live here, not in schemas, so schemas don’t silently mask missing values.
- **Stable outputs**: `buildQuery` ensures deterministic string ordering for cache hits.
- **Future-proofing**: new defaults can be added here without touching schemas.

---

✅ With this setup, your client always sends **only the necessary parameters**, while safely assuming CoinGecko’s defaults.
