# Core

Shared, framework‑agnostic building blocks for the CoinGecko typings library.

- **Primitives** (`primitives.ts`): generic Zod atoms, brand helpers, tolerant URL, date formats.
- **Common** (`common.ts`): CoinGecko‑specific enums, branded IDs, reusable request fragments, and response fragments.
- **Helpers** (`helpers.ts`): small generic Zod helpers used across the repo.

> This folder has **no HTTP/runtime concerns**. Infra such as query serialization and server defaults live in `src/runtime/`.

---

## Contents

- [Design principles](#design-principles)
- [Modules](#modules)
  - [primitives.ts](#primitivests)
  - [common.ts](#commonts)
  - [helpers.ts](#helpersts)
- [Common patterns](#common-patterns)
  - [CSList](#cslist)
  - [Pagination & PageOnly](#pagination--pageonly)
  - [tolerantObject](#tolerantobject)
  - [RecordBy](#recordby)
- [Branding & type safety](#branding--type-safety)
- [Zod & TS settings](#zod--ts-settings)
- [Examples](#examples)

---

## Design principles

1. **Runtime‑light, type‑rich**  
   Use Zod for runtime validation only where necessary; keep most reuse in types & fragments.

2. **Stable wire format**  
   Helpers (e.g. `CSList`) produce deterministic comma‑strings to align with caching and de‑dupe.

3. **Tolerant responses, strict requests**  
   Requests are `.strict()`; responses use `tolerantObject(...).catchall(z.unknown())` to survive upstream field additions.

4. **No per‑endpoint logic here**  
   Core is reusable across endpoints; keep endpoint details in `src/endpoints/*`.

---

## Modules

### `primitives.ts`

Generic atoms used everywhere:

- `ISODateTime`: string regex for `YYYY-MM-DDTHH:mm:ss(.sss)?Z`.
- `DdMmYyyy`: date string for `/history` (`dd-mm-yyyy`).
- `UrlString`: tolerant URL string that accepts `""` (normalized to `undefined`) and avoids `z.url()` deprecation.
- `NonEmptyString`, `CoercedNumber`, `NullableNumber`.
- `brand<T,B>()`: creates nominal “brands” for scalars (e.g., `CoinId`, `VsCurrency`).

> Branding gives compile‑time separation without runtime cost.

---

### `common.ts`

CoinGecko‑specific types and fragments:

- **Branded IDs**: `CoinId`, `VsCurrency`; plus plain IDs: `AssetPlatformId`, `ExchangeId`, `MarketId`, `ContractAddress` (EVM‑heuristic or string).
- **Request fragments**:
  - `CSList(inner?)`: comma‑string list, sorted + deduped.
  - `PageOnly`: `{ page }` (default `1`).
  - `Pagination`: `{ per_page, page }` (defaults `100`/`1`).
  - `IncludeTokens`: `"top" | "all"` (default `"top"`).
  - `IdsNamesSymbolsTokens`: common block for `/simple/price` and `/coins/markets`.
- **Enums**: `MarketsOrder`, `TickersOrder`, `DerivativesExchangesOrder`, `PrecisionString`, `MarketsLocale`, `PriceChangeWindows`, `OhlcDays`, `DailyInterval`, `DexPairFormat`.
- **Response fragments**:
  - `ImageUrls`, `Localization`, `QuoteMap`, `TsSeries`, `OhlcTuple`, `MarketChart`.
  - `MarketRef`, `Ticker`, `TickersEnvelope`.
  - Epoch helpers: `UnixMs`, `UnixSec`.
- **Utils**: `tolerantObject(shape)`, `RecordBy(keySchema, valueSchema)`.

Defaults in `common.ts` reflect **documented server defaults** where appropriate and align with `runtime/server-defaults.ts`.

---

### `helpers.ts`

Small generic helpers:

- `QueryValue` / `QueryObject`: flexible schema for querystring‑like shapes.
- `Infer<T>`: alias for `z.infer<T>`.

---

## Common patterns

### CSList

```ts
import { CSList } from "@core/common";

// Accepts string | string[] and outputs stable CSV (sorted + deduped)
const ids = CSList().parse(["ethereum", "bitcoin", "ethereum"]); // "bitcoin,ethereum"
const windows = CSList(PriceChangeWindows).parse(["24h", "7d"]); // "24h,7d"
```

### Pagination & PageOnly

```ts
import { Pagination, PageOnly } from "@core/common";

const p = Pagination.parse({}); // { per_page: 100, page: 1 }
const p2 = PageOnly.parse({}); // { page: 1 }
```

### tolerantObject

```ts
import { tolerantObject } from "@core/common";
import { z } from "zod";

const CoinRow = tolerantObject({
  id: z.string(),
  name: z.string(),
});
// parses unknown extra fields without failing
```

### RecordBy

```ts
import { RecordBy } from "@core/common";
import { z } from "zod";

const QuoteMap = RecordBy(z.string(), z.number()); // Record<string, number>
```

---

## Branding & type safety

Branding creates **nominal** types for scalars:

```ts
import { brand } from "@core/primitives";
import { z } from "zod";

const CoinId = brand(z.string().min(1), "CoinId");
// type CoinId = string & { readonly __brand: "CoinId" }
```

Branded values **are still strings at runtime**, but TypeScript prevents mixing them with plain strings in places where a `CoinId` is specifically expected.

---

## Zod & TS settings

This project targets **Zod v4** and TS5+.

Recommended `tsconfig` flags (already in repo):

- `"moduleResolution": "Bundler"` (or `NodeNext`) for modern ESM packages like Zod.
- `"verbatimModuleSyntax": true` to separate type/value exports (`export type { ... }`).
- `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true` for safer schema work.

---

## Examples

```ts
import { coins } from "ZodGecko";
import { buildQuery } from "ZodGecko"; // from runtime

// Request schema usage
const req = coins.schemas.MarketsRequestSchema.parse({
  vs_currency: "usd",
  ids: ["bitcoin", "ethereum"],
});

// Build query (drops defaults; stable ordering)
const qs = buildQuery({
  vs_currency: "usd",
  per_page: 100, // default → dropped
  page: 1, // default → dropped
});
```

```ts
import { coins } from "ZodGecko";

// Response schema usage (tolerant to new fields)
const data = coins.schemas.MarketsResponseSchema.parse(await fetchJson(...));
```

### Gotchas

- Don’t wrap core fragments that have defaults (e.g., `Pagination`, `MarketsOrder`) in `.optional()`—you’ll lose their defaults. Let `buildQuery` drop defaults instead.
- Use `UrlString` instead of `z.string().url()` (deprecated in your Zod version and too strict for some CG payloads).
- When re‑exporting types with `"verbatimModuleSyntax": true`, use `export type { ... }`.

For runtime concerns (query serialization, default stripping), see `src/runtime/README.md`.
