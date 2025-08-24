# Core

Shared building blocks used across all endpoint groups.

- **No network code here.**
- **No endpoint-specific defaults** or path concerns—those live in `runtime/`.

## Exports

Available via `zodgecko/core` (re-exported from `src/core/index.ts`):

- Schema helpers: `tolerantObject`, `RecordBy`, `CSList`, `PriceChangeWindows`
- Primitives/utilities from `common.ts`, `primitives.ts`, `helpers.ts`
- Branded types used across endpoints

```ts
import { tolerantObject, RecordBy, CSList } from "zodgecko/core";
```

## Usage snippets

### Tolerant objects

```ts
import { z } from "zod";
import { tolerantObject } from "zodgecko/core";

const Platform = tolerantObject({
  id: z.string(),
  name: z.string().optional(),
});

// extra fields are allowed/preserved
Platform.parse({ id: "eth", name: "Ethereum", future_field: true });
```

### Records with constrained key/value types

```ts
import { z } from "zod";
import { RecordBy } from "zodgecko/core";

const FxMap = RecordBy(z.string(), z.number()); // e.g. { usd: 1, eur: 0.9 }
```

### CSV normalization (stable, deduped)

```ts
import { CSList, PriceChangeWindows } from "zodgecko/core";

const PriceWindows = CSList(PriceChangeWindows);
PriceWindows.parse(["7d", "24h", "7d"]); // "24h,7d"
```

### Branded IDs (example pattern)

```ts
import { z } from "zod";

type Brand<T, B extends string> = T & { readonly __brand: B };
type CoinId = Brand<string, "CoinId">;

// Typical pattern used in schemas:
const CoinIdSchema = z.string().min(1) as unknown as z.ZodType<CoinId>;
```

## When to add things here

Add to `core` if it is:

- A reusable **schema fragment** used by multiple endpoints
- A tiny **type utility** or branded primitive
- Normalization logic that is **not** endpoint-specific

**Do not** put here:

- Query-string logic (lives in `runtime/`)
- Endpoint-specific enums/defaults (belong in that endpoint’s `schemas.ts` and in `runtime/server-defaults.ts` if applicable)

See also: `runtime/README.md` for request serialization rules.
