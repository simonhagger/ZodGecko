# TESTING

This project aims to be **predictable, type-safe, and tolerant**:

- **Requests**: strict validation with Zod; deterministic query serialization.
- **Responses**: tolerant parsing (unknown fields preserved where appropriate).
- **Runtime**: stable booleans/numbers/CSVs, no surprises.

This doc defines the **shared conventions** for testing across the codebase. Endpoint- or feature-specific notes should link here for rules and patterns.

---

## Structure & layout

> Paths below reflect the current repository structure.

```
src/
  core/
    __tests__/                  # core unit tests (helpers/primitives/query utils)
      common.cslist.test.ts
      common.utils.test.ts
      ddmmyyyy.test.ts
      explain-zod-error*.test.ts
      parse-utils*.test.ts
      primitives.urlstring.test.ts
      test-helpers.ts

  endpoints/
    __tests__/                  # functional harness + shared test utils/fixtures
      _utils/
        assertions.ts           # common assertion helpers (defaults, required, path params, etc.)
        defaults.ts             # server default helpers for tests
        fixtures.ts             # fixture loaders and helpers
        harness.ts              # EndpointHarness (harness implementation)
        index.ts                # re-exports for convenience
        normalize.ts            # CSV/boolean/number normalization helpers
        path.ts                 # path param helpers (drop id/address)
        schema.ts               # schema-introspection helpers
      endpoints.functional.test.ts                # single, over-arching functional suite
      endpoints.functional.test.requirements.md   # documentation of harness expectations
      fixtures/                                    # shared JSON fixtures for many endpoints
        asset_platforms.response.json
        coins.by-id.*.json
        coins.categories*.json
        ... (see repo)

    asset_platforms/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    categories/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    coins/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    companies/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    contract/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    derivatives/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    exchanges/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    global/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    ping/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    search/
      index.ts
      requests.ts
      responses.ts
      schemas.ts
    simple/
      index.ts
      requests.ts
      responses.ts
      schemas.ts

  runtime/
    __tests__/
      drop-params.test.ts
      format-path.test.ts
      public-api.smoke.test.ts
      query.*.test.ts
      server-defaults.test.ts
      url.utils.test.ts
      validate.test.ts
      with-defaults.test.ts
    endpoints.ts                # registry of ALL_ENDPOINTS + schema accessors
    index.ts
    query.ts
    server-defaults.ts
    url.ts
    validate.ts
    with-defaults.ts
```

**Key points**

- **Harness-first**: functional testing is centralized in `src/endpoints/__tests__/endpoints.functional.test.ts`, driven by the implementation in `_utils/harness.ts`.
- **Local unit tests** live in `src/core/__tests__` and `src/runtime/__tests__`.
- **Shared fixtures** are under `src/endpoints/__tests__/fixtures/`.

---

## Golden rules

1. **Schema first.** Type request literals as the **schema input** and validate with the schema before building the query.
2. **Serializer is pure.** `buildQuery(path, obj)` never invents values; defaults are applied at the schema parse stage, not by serialization.
3. **Responses are tolerant** unless the API guarantees a closed shape. Prefer tolerant objects where reasonable.
4. **Harness-driven.** Endpoint functional testing runs through the shared harness to ensure consistency and coverage.

---

## Typing & schemas

### Use schema **input** for request literals

```ts
import type { z } from "zod";
import { coins } from "../../.."; // example import from package barrel

type ReqIn = z.input<typeof coins.schemas.CoinDetailRequestSchema>;

const req: ReqIn = { localization: false, tickers: true };
const parsed = coins.schemas.CoinDetailRequestSchema.parse(req);
```

### Use schema **output** for parsed variables

```ts
import type { z } from "zod";
import { coins } from "../../..";

type Out = z.output<typeof coins.schemas.CoinsListRequestSchema>;

const parsed: Out = coins.schemas.CoinsListRequestSchema.parse({});
```

Prefer inline parsing unless the parsed value must be reused.

---

## Harness approach

- The canonical suite is `src/endpoints/__tests__/endpoints.functional.test.ts`.
- The harness implementation lives in `src/endpoints/__tests__/_utils/harness.ts` and is consumed by the suite.
- Common helpers are in `_utils/` (see **Structure & layout** above).

**The harness verifies**

- Request serialization (`buildQuery`) normalization of arrays → CSV (sorted/de-duped), booleans → strings, numbers → strings.
- Application of schema defaults (after `parse()`), versus serializer baseline (no defaults injected).
- Response parsing + tolerant preservation of unknown fields.
- Path param handling (e.g., `id`, `contract_address`) via `_utils/path.ts` helpers.
- Required/optional param behavior using assertion helpers from `_utils/assertions.ts`.

---

## Standard helper patterns (as used in this repo)

> Import paths below assume you are inside `src/endpoints/__tests__`. Adjust `../` as needed when used elsewhere.

### 1) Access schemas for an endpoint

```ts
import { getSchemas } from "../../runtime"; // re-exported in src/runtime/index.ts

const EP = "/coins/{id}/history" as const;
const { req, res } = getSchemas(EP); // req = request Zod schema, res = response Zod schema
```

### 2) Enumerate required query keys

```ts
import { getRequiredKeysFromSchema } from "./_utils/schema";

const required = getRequiredKeysFromSchema(req); // string[] of required top-level query keys
```

### 3) Drop path params before serialization

```ts
import { dropId, dropIdAndAddress } from "./_utils/path";

const withPath = { id: "bitcoin", tickers: true };
const q = dropId(withPath); // => { tickers: true }
```

### 4) Build a normalized query string object

```ts
import { buildQuery } from "../../runtime";

const parsed = req.parse({ vs_currency: "usd", ids: ["eth", "btc", "eth"] });
const qs = buildQuery(EP, parsed);
// Arrays → CSV (sorted/deduped), booleans → "true"|"false", numbers → strings, empties dropped
```

### 5) Assert defaults/required behavior (composed assertions)

```ts
import {
  expectNoDefaults,
  expectNoDefaultsKeepOthers,
  expectKeepsOnlyNonDefaults,
  expectMissingRequiredFails,
  expectDropsPathParams,
} from "./_utils";

// No defaults injected if you serialize without parsing
expectNoDefaults(EP, {});

// Keep provided non-defaults; do not inject server defaults
expectNoDefaultsKeepOthers(EP, { page: 2 });

// After parse, only non-default keys should remain in the query
expectKeepsOnlyNonDefaults(EP, { order: "market_cap_desc" });

// Missing required key should fail validation
expectMissingRequiredFails(EP, "vs_currency");

// Path params are removed before serialization
expectDropsPathParams(EP, { id: "bitcoin", tickers: true });
```

> The exact assertion names are exported via `src/endpoints/__tests__/_utils/index.ts`. If you add new assertions in `assertions.ts`, re-export them there.

### 6) Server defaults helpers

```ts
import { serverDefaultsFor } from "./_utils/defaults";

const defs = serverDefaultsFor(EP); // Record<string, unknown> of defaults for EP
```

### 7) Fixtures (shared)

```ts
import coinsById from "./fixtures/coins.by-id.response.json" with { type: "json" };
const parsed = res.parse(coinsById as unknown);
```

### 8) Safe object checks & tiny guards

```ts
import { isObjectRecord } from "./_utils";
import { z } from "zod";

const RowHasId = z.object({ id: z.string().min(1) });
const first = (parsed as unknown[])[0];
expect(RowHasId.safeParse(first).success).toBe(true);
expect(isObjectRecord(first) && Object.hasOwn(first, "some_future_field")).toBe(true);
```

---

## Fixtures

- Shared fixtures live under `src/endpoints/__tests__/fixtures/` and are imported with ESM JSON assertions:

```ts
import coinsById from "../fixtures/coins.by-id.response.json" with { type: "json" };
```

Guidelines:

- Keep fixtures **tiny** and **stable**; prefer fixed values and small arrays.
- **Never mutate fixtures** in tests. If you need a variant, create a separate fixture or build a small inline payload.
- To prove tolerance, add an extra **top-level** field where the schema is tolerant (avoid breaking constrained maps).

Naming examples:

- `simple.price.response.json`
- `coins.by-id.response.json`
- `exchanges.list.response.json`

---

## Query serialization rules (contract)

`buildQuery()` normalization:

- **Arrays → CSV**: de-duplicate + sort.
- **Booleans → strings**: `"true" | "false"`.
- **Numbers → strings** (finite only); drop `NaN`/`±Infinity`.
- **Drop empties/unknowns**: `[]`, `""`/whitespace-only, objects/functions.
- **Defaults**:
  - Schema-level defaults appear **after `parse()`**.
  - The serializer never injects values on its own.

---

## Patterns

### Requests checks (via harness)

- Happy path + strictness (reject unknown keys / invalid enums).
- Serialized shape (CSV/boolean/number) and dropping of empties.
- Remove path params before serialization using `_utils/path.ts` helpers.

### Responses checks (via harness)

- Parse fixture with schema.
- Assert essentials with tiny Zod guards.
- Prove unknown key preservation safely (use `isObjectRecord` helper from `_utils` before property checks).

Example:

```ts
import { z } from "zod";
import { isObjectRecord } from "./_utils";

const RowHasId = z.object({ id: z.string().min(1) });

const parsed = assetPlatforms.schemas.AssetPlatformsResponseSchema.parse(fixture as unknown);
const first = (parsed as unknown[])[0];
expect(RowHasId.safeParse(first).success).toBe(true);
expect(
  isObjectRecord(first) && Object.prototype.hasOwnProperty.call(first, "some_future_field"),
).toBe(true);
```

### Sanity patterns

- **Serializer baseline**: `buildQuery("/ping", {})` → `{}`.
- **Endpoint contract**: parse-first to surface schema defaults, then serialize.

---

## Helpers (from `src/endpoints/__tests__/_utils`)

- `assertions.ts` — composed assertions around defaults, required params, path params, etc.
- `defaults.ts` — server default utilities for tests.
- `fixtures.ts` — fixture loaders/generators.
- `path.ts` — helpers to drop path params before serialization.
- `schema.ts` — helpers like `getRequiredKeysFromSchema`.
- `normalize.ts` — CSV/boolean/number normalization helpers.

Keep helpers generic and re-usable. Avoid endpoint-specific logic here.

---

## Adding or modifying endpoints (playbook)

1. Define/adjust request & response schemas under `src/endpoints/<group>/`.
2. Ensure the functional harness suite covers the endpoint.
3. Add/update minimal fixtures in `src/endpoints/__tests__/fixtures/`.
4. Add endpoint-local tests **only** for peculiar edge cases not captured by the harness.
5. If behavior differs materially, add notes to `endpoints.functional.test.requirements.md`.

---

## Running & focusing

```bash
# All with coverage
npm run test:coverage

# Focus the main functional suite
npx vitest run src/endpoints/__tests__/endpoints.functional.test.ts

# Focus by test title
npx vitest run -t "coins parsed {}"
```

---

## Troubleshooting

- **Unsafe assignment/member access**: parse inline or annotate with `z.output<...>`; use `isObjectRecord` before property access.
- **Why did `{}` become `{ page: '1' }`?** You parsed it. Defaults are schema-level; calling `buildQuery` without parse keeps `{}` as `{}`.
- **CSV order changed**: expected — arrays are sorted and de-duplicated before CSV serialization.
