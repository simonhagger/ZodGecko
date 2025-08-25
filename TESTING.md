# TESTING

This project aims to be **predictable, type-safe, and tolerant**:

- **Requests**: strict validation with Zod; deterministic query serialization.
- **Responses**: tolerant parsing (unknown fields preserved where appropriate).
- **Runtime**: stable CSVs, boolean/number normalization, no surprises.

This doc defines the shared rules, helpers, layout, and _fixtures policy_ used across all endpoint tests. Per-endpoint docs should focus on behavior and link back here for conventions.

---

## Layout & naming

```
src/
  endpoints/
    __tests__/
      _utils/                      # shared helpers (no tests inside)
      _shared/                     # shared data/fixtures across endpoints (optional)
        fixtures/                  # only if multiple endpoints reuse the same data
      <endpoint>/
        docs/                      # per-endpoint functional notes
        fixtures/                  # JSON fixtures for this endpoint
        <endpoint>.requests.test.ts
        <endpoint>.responses.test.ts
        <endpoint>.<route>.functional.test.ts  # 1+ per route
        <endpoint>.sanity.functional.test.ts   # tiny contract checks
```

- Files inside `_utils` and `_shared` are **ignored by Vitest** (configured).
- Keep **fixtures** beside the tests that use them (under `<endpoint>/fixtures/`) unless multiple endpoints need the same payload—then place in `_shared/fixtures/`.
- Per-endpoint docs link back to this page for conventions; they only describe that endpoint’s behavior.

---

## Golden rules

1. **Schema first.** Always type request literals as the **schema input** and validate with the schema before building the query.
2. **Serializer is pure.** `buildQuery(path, obj)` never invents values; it serializes what you give it. Defaults live in schemas.
3. **Responses are tolerant** unless the API truly guarantees a closed shape. Prefer “allow unknown” objects where reasonable.

---

## Typing & schemas

### Use schema **input** for request literals

```ts
import type { z } from "zod";
type ReqIn = z.input<typeof coins.schemas.CoinDetailRequestSchema>;

const req: ReqIn = { localization: false, tickers: true };
const parsed = coins.schemas.CoinDetailRequestSchema.parse(req);
```

Why: avoids branded type friction and keeps ESLint happy (`no-unsafe-*`).

### Use schema **output** when you must keep a parsed variable

```ts
import type { z } from "zod";
type CLReqOut = z.output<typeof coins.schemas.CoinsListRequestSchema>;

const parsed: CLReqOut = coins.schemas.CoinsListRequestSchema.parse({});
```

Otherwise, parse inline inside an assertion to avoid temporary variables.

---

## Path params

**Do not** serialize path params. Use helpers:

```ts
import { dropId, dropIdAndAddress } from "../_utils";
const q1 = dropId({ id: "bitcoin", tickers: true });
const q2 = dropIdAndAddress({ id: "ethereum", contract_address: "0x...", vs_currency: "usd" });
```

(Prefer helpers over destructuring like `{ id: _id, ...q }` to avoid lint churn.)

---

## Query serialization rules

`buildQuery()` applies consistent normalization **to the object you pass**:

- **Arrays → CSV**: dedupe + sort (stable), e.g. `['b','a','a'] → 'a,b'`.
- **Booleans → strings**: `'true' | 'false'`.
- **Numbers → strings** (finite only); drop `NaN`/`±Infinity`.
- **Drop empties/unknowns**: `[]`, `""` (or whitespace-only), objects/functions → dropped.
- **Defaults**:
  - If a **schema** sets a default (e.g., pagination `page=1`, `per_page=100`), that value appears **after `parse()`**.
  - Don’t “invent” defaults in tests. Either:
    - assert the **serializer baseline** (`{}` stays `{}`) **without** parsing, or
    - assert the **endpoint contract** (parse first → defaults) **when the schema defines them**.

---

## Fixtures

**Where they live**

- Per-endpoint: `src/endpoints/__tests__/<endpoint>/fixtures/`
- Shared across endpoints (rare): `src/endpoints/__tests__/_shared/fixtures/`

**File format**

- Use **JSON** fixtures (`.json`) for stability and portability.
- Import via ESM with import assertions:

  ```ts
  import priceFx from "./fixtures/simple.price.response.json" with { type: "json" };
  ```

**Size & stability**

- Keep fixtures **tiny**: only the minimum fields required for the schema to parse and for the test to prove intent.
- Prefer **stable values** (fixed timestamps, small numbers) over live-like noise.
- **Never mutate fixtures** in tests. If you need a variant, either:
  - create a separate fixture file; or
  - build a small **inline payload** directly in the test.

**Tolerance assertions**

- To prove “unknown fields are preserved”, add an **extra top-level key** (or envelope-level key) where the schema is tolerant.
- Avoid inserting unknown keys _inside_ maps that the schema constrains to specific types (e.g., numeric maps) – the parser should reject those.
- Use the safe pattern to check for unknown key survival:

  ```ts
  import { isObjectRecord } from "../_utils";
  const parsed = someSchema.parse(fixture as unknown);
  const obj = parsed as Record<string, unknown>;
  expect(
    isObjectRecord(obj) && Object.prototype.hasOwnProperty.call(obj, "some_future_field"),
  ).toBe(true);
  ```

**Naming**

- Prefer `<endpoint>.<route>.response.json` for clarity, e.g.:
  - `simple.price.response.json`
  - `simple.token-price.response.json`
  - `status-updates.response.json`
  - `indexes.list.response.json`

- Use one fixture per **distinct response shape**. If the same shape serves multiple routes, a single shared fixture is fine.

**When to use inline payloads**

- When testing **rejection** (invalid enums, wrong types) – easier to read inline.
- When proving tolerance with a minimal constructed object.
- When the payload is too trivial to justify a file (e.g., an array of strings).

---

## Requests tests

- Validate **happy path** and **strictness** (reject unknown keys / invalid enums).
- Assert **serialized** shape (CSV + booleans + numbers).
- For routes with path params, **drop** them before serialization.

Example:

```ts
import { describe, it, expect } from "vitest";
import type { z } from "zod";
import { simple, buildQuery } from "../../../index.js";
import { dropId, expectValid, expectInvalid } from "../_utils";

type PriceIn = z.input<typeof simple.schemas.SimplePriceRequestSchema>;

describe("simple.requests", () => {
  it("CSV + booleans", () => {
    const req: PriceIn = {
      ids: ["eth", "btc", "eth"],
      vs_currencies: ["usd", "eur"],
      include_24hr_vol: true,
    };
    const parsed = simple.schemas.SimplePriceRequestSchema.parse(req);
    expect(buildQuery("/simple/price", parsed)).toEqual({
      ids: "bitcoin,ethereum",
      vs_currencies: "eur,usd",
      include_24hr_vol: "true",
    });
  });

  it("strictness", () => {
    expectInvalid(simple.schemas.SimplePriceRequestSchema, { ids: [], vs_currencies: ["usd"] });
  });
});
```

---

## Responses tests

Pattern: **parse with schema → assert essentials via tiny Zod guards → prove unknown preservation** without unsafe property access.

```ts
import { z } from "zod";
import { isObjectRecord } from "../_utils";

// local guards to avoid reading unknown directly
const RowHasId = z.object({ id: z.string().min(1) });

const parsed = assetPlatforms.schemas.AssetPlatformsResponseSchema.parse(fixture as unknown);
const first = (parsed as unknown[])[0];
expect(RowHasId.safeParse(first).success).toBe(true);

// unknowns preserved?
expect(
  isObjectRecord(first) && Object.prototype.hasOwnProperty.call(first, "some_future_field"),
).toBe(true);
```

Guidelines:

- Keep fixtures **small** and stable. Don’t mutate fixtures in tests.
- To assert tolerance, prefer adding an **extra top-level** key or use a tiny inline payload.

---

## Sanity tests (two tiny patterns)

Pick the one that matches the route; for some endpoints include both.

```ts
// A) Serializer baseline: NO defaults
expect(buildQuery("/ping", {})).toEqual({});

// B) Endpoint contract: schema defaults surface after parse
type CLReqOut = z.output<typeof coins.schemas.CoinsListRequestSchema>;

const parsed: CLReqOut = coins.schemas.CoinsListRequestSchema.parse({});
expect(buildQuery("/coins/list", parsed)).toEqual({ include_platform: false });
```

---

## Helpers (from `__tests__/_utils`)

- `expectValid(schema, value)` / `expectInvalid(schema, value)`
  One-liners that keep tests readable; they also encode our “schema-first” rule.
- `dropId(value)` / `dropIdAndAddress(value)`
  Remove path params before serialization (typed; avoids `any`/unsafe access).
- `isObjectRecord(v: unknown): v is Record<string, unknown>`
  Safe guard for unknown → object before `hasOwnProperty` checks.
- _(Optional)_ `invalidEnumValue<T extends string>()`
  Utility to generate a value that’s guaranteed not to be in a known enum (when you want to assert failures without using `any`).

> If you add new helpers, keep them generic and re-usable. Avoid endpoint-specific logic in `_utils`.

---

## DRY & consistency checklist

- ✅ Use **schema input** types for request literals; **output** types for parsed variables.
- ✅ Use **helpers** for path params and common assertions.
- ✅ Keep **sanity** tests minimal; don’t duplicate functional scenarios there.
- ✅ Responses: **Zod guard + `isObjectRecord`** instead of direct property access on `unknown`.
- ✅ Per-endpoint markdown: focus on **behaviors**; link to this `TESTING.md` for conventions.
- ✅ **Fixtures** are tiny, stable, never mutated; unknowns tested at tolerant levels.

---

## Running & focusing

```bash
# All with coverage
npm run test:coverage

# Focus by filename or title substring
npx vitest run src/endpoints/__tests__/simple/simple.price.functional.test.ts
npx vitest run -t "coins parsed {}"
```

---

## Adding a new endpoint (playbook)

1. **Schemas** (requests/responses) using core fragments (`CSList`, `Pagination`, tolerant object helpers).
2. **Requests test**: happy path + strictness + serialization.
3. **Responses test**: parse fixture(s) + essential field guard + unknown preservation.
4. **Functional tests**: one per route (path-param drop, CSV/boolean/number rules, default-dropping).
5. **Sanity**: serializer baseline and/or endpoint contract (see above).
6. **Docs**: create `<endpoint>.functional.testing.md` describing only that endpoint’s behaviors; link to `TESTING.md`.
7. **Fixtures**: add minimal JSON under `<endpoint>/fixtures/` (or `_shared/fixtures/` if reused). Import with `with { type: "json" }`. Keep small and stable.

---

## Troubleshooting

- **“Unsafe assignment/member access”**: parse inline or annotate with `z.output<...>`; use `isObjectRecord` before property checks.
- **“Why did `{}` become `{ page: '1' }`?”** You parsed it. Defaults are schema-level; calling `buildQuery` **without** parse keeps `{}` as `{}`.
- **CSV order changed**: expected; CSVs are sorted and de-duplicated by design.
