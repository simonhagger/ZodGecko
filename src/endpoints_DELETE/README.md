# Endpoints

Each subfolder under `endpoints/` is an **endpoint group** (e.g., `coins`, `simple`, `exchanges`).  
Every group exposes a **leaf barrel** (`index.ts`) that is re-exported from the package root.

## Public surface

Each group’s barrel should export:

- `export * as schemas from "./schemas.js"` — the Zod **request/response** schemas used at runtime.
- `export type { ... }` — request/response **type aliases** inferred from those schemas.

**Import examples**

```ts
// From the package root (preferred by users)
import { coins, simple } from "zodgecko";

// Or from grouped subpath (useful internally)
import { coins as coinsNs } from "zodgecko/endpoints";

// Validate a request
const req = coins.schemas.MarketsRequestSchema.parse({ vs_currency: "usd" });
```

## Conventions

- **Requests are strict.** Unknown keys are rejected (`.strict()`), enums are validated, and nothing about server defaults is encoded into request schemas.
- **Responses are tolerant.** Prefer `tolerantObject(...)` or `.catchall(z.unknown())` for forward-compatibility with upstream additions.
- **Path params are never serialized.** Drop path keys (e.g., `{ id }`) before calling the query builder:

  ```ts
  import { buildQuery } from "zodgecko/runtime";

  const { id: _id, ...q } = { id: "bitcoin", page: 2 } as const;
  void _id;
  buildQuery("/coins/{id}/tickers", q); // { page: "2" }
  ```

  > In tests you may use the small helper `dropId(...)`; it is **test-only**, not part of the runtime API.

- **Server defaults live in `runtime`.** If an endpoint has documented defaults (e.g., paging), add them to `runtime/server-defaults.ts`.
  `buildQuery(...)` will drop values that equal those defaults.

## File layout (per group)

```
endpoints/
  coins/
    index.ts          # barrel: exports `schemas` + types
    schemas.ts        # zod schemas (requests/responses)
    requests.ts       # request type aliases (inferred)
    responses.ts      # response type aliases (inferred)
    docs/
      coins.functional.testing.md
```

> **Tests** live outside the group: `src/endpoints/__tests__/<group>/...`
> See **TESTING.md** for full testing layout, fixtures guidance, and helpers.

## Adding a new endpoint group (checklist)

1. Create `schemas.ts` with request/response schemas.
2. Create `requests.ts` / `responses.ts` exporting inferred types.
3. Create `index.ts` that:
   - `export * as schemas from "./schemas.js"`
   - `export type { ... }` from `./requests.js` and `./responses.js`

4. If the API documents server defaults, add them to `runtime/server-defaults.ts`.
5. Write tests under `src/endpoints/__tests__/<group>/` following `TESTING.md`.
6. Keep shared schema fragments in `core/` (avoid endpoint-specific code in `core`).

## Pitfalls to avoid

- Don’t serialize path params; only **query** belongs in `buildQuery`.
- Don’t hide defaults in request schemas; let `runtime` handle dropping.
- Don’t duplicate shared fragments; lift them into `core/` and reuse.
