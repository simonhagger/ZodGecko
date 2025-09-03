# TESTING

This project aims to be **predictable, type-safe, and tolerant**:

- **Requests**: strict validation with Zod; deterministic query serialization.
- **Responses**: tolerant parsing (unknown fields preserved where appropriate).
- **Runtime**: stable booleans/numbers/CSVs, no surprises.

This doc defines the **shared conventions** for testing across the codebase.

---

## Structure & layout

```
src/
  helpers/__tests__/      # unit tests for helpers (format-params, format-path, etc.)
  registry/__tests__/     # registry integrity checks
  testkit/fixtures/       # JSON fixtures per endpoint
    <version>/<plan>/<endpoint>/
      defaults/           # default.request.json + default.response.json
      scenarios/          # additional named request/response pairs
  testkit/fixtures/runner.spec.ts   # auto-discovers and runs fixtures
```

**Key points**

- **Fixture-first**: endpoint testing flows through the shared fixture runner.
- **Local unit tests** live beside helpers/registry modules.
- **Fixtures** drive request/response validation without writing brittle ad hoc tests.

---

## Golden rules

1. **Schema first.** Type request literals as the **schema input** and validate with the schema before building the query.
2. **Serializer is pure.** `formatParams*` never invents values; defaults are applied at the schema stage, not by serialization.
3. **Responses are tolerant** unless the API guarantees a closed shape.
4. **Fixtures-driven.** Endpoint behavior is proven by minimal JSON fixtures and the runner.

---

## Typing & schemas

### Use schema **input** for request literals

```ts
import type { z } from "zod";
import { getSchemas } from "zodgecko";

const { requestSchema } = getSchemas("coins.by-id");
type ReqIn = z.input<typeof requestSchema>;

const req: ReqIn = { localization: false };
requestSchema.parse(req);
```

### Use schema **output** for parsed values

```ts
import type { z } from "zod";
import { getSchemas } from "zodgecko";

const { requestSchema } = getSchemas("simple.price");
type Out = z.output<typeof requestSchema>;

const parsed: Out = requestSchema.parse({ ids: "bitcoin", vs_currencies: "usd" });
```

---

## Fixture runner

- The canonical suite is `src/testkit/fixtures/runner.spec.ts`.
- It discovers per-endpoint fixture folders under `testkit/fixtures/<version>/<plan>/<endpoint>/`.
- Defaults folder must contain `default.request.json` + `default.response.json` (or is skipped if not applicable).
- Scenarios folder may contain additional named request/response pairs.
- Empty folders are silently skipped.

**The runner verifies**

- Request parsing + serialization (arrays → CSV, booleans/numbers → strings).
- Application of schema defaults vs server defaults.
- Response parsing + tolerant preservation of unknown fields.
- Deterministic URL building via helpers.

---

## Standard patterns

### 1) Access schemas for an endpoint

```ts
import { getSchemas } from "zodgecko";

const { requestSchema, responseSchema } = getSchemas("coins.by-id.history");
```

### 2) Build request shape via client

```ts
import { createClient } from "zodgecko/client";

const client = createClient("v3.0.1/public");
const surface = client.getRequestFor("coins.by-id");
```

### 3) Fixture usage

```ts
import fixture from "../fixtures/v3.0.1/public/coins.by-id/default.response.json" assert { type: "json" };

const { responseSchema } = getSchemas("coins.by-id");
responseSchema.parse(fixture as unknown);
```

### 4) Small Zod guards for essentials

```ts
import { z } from "zod";

const RowHasId = z.object({ id: z.string().min(1) });
const first = (fixture as any[])[0];
expect(RowHasId.safeParse(first).success).toBe(true);
```

---

## Fixtures

Guidelines:

- Keep fixtures **tiny** and **stable**.
- **Never mutate fixtures** in tests. If you need a variant, add a new JSON file.
- To prove tolerance, add an extra **top-level** field where schemas allow it.

Naming examples:

- `simple.price.response.json`
- `coins.by-id.response.json`
- `exchanges.list.response.json`

---

## Serialization rules (contract)

`formatParams*` normalization:

- **Arrays → CSV**: de-duplicate + sort.
- **Booleans → strings**: "true" | "false".
- **Numbers → strings**: finite only; drop `NaN`/`±Infinity`.
- **Drop empties/unknowns**: `[]`, `""`, whitespace-only, objects/functions.
- **Defaults**: applied at schema parse stage; serializers never inject values.

---

## Patterns

### Requests

- Happy path + strictness (reject unknown keys / invalid enums).
- Serialized shape (CSV/boolean/number) and dropping of empties.
- Path params removed before serialization.

### Responses

- Parse fixture with schema.
- Assert essentials with tiny Zod guards.
- Prove unknown key preservation safely.

### Sanity

- Serializer baseline: empty → empty.
- Endpoint contract: parse-first to surface schema defaults, then serialize.

---

## Adding or modifying endpoints (playbook)

1. Define/adjust schemas under `src/schemas/<slug>/<version>/<plan>/`.
2. Run `pnpm gen:registry`.
3. Add/update minimal fixtures under `testkit/fixtures/...`.
4. Run the fixture runner and ensure green.
5. Add endpoint-local unit tests only for peculiar edge cases.

---

## Running & focusing

```bash
# All with coverage
pnpm test:coverage

# Watch mode
pnpm test -- --watch

# Single spec
pnpm test -- src/helpers/__tests__/format-params.spec.ts
```

---

## Troubleshooting

- **Unsafe assignment/member access**: use `z.output<...>` and guards.
- **Defaults appearing unexpectedly**: remember defaults come from schema parse.
- **CSV order changed**: expected — arrays are sorted/deduped.
