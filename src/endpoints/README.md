# Endpoints

Self‑contained endpoint groups (schemas, request/response types, and public barrels).  
Each subfolder represents a CoinGecko API group (e.g., `coins`, `exchanges`, `simple`).

**This layer only depends on**:

- `src/core/` for shared Zod primitives, CoinGecko enums/fragments, and helpers.
- (Optionally) `src/runtime/` in docs/examples, but endpoint code itself is schema‑only.

> Public consumers import endpoints **from the package root**:
>
> ```ts
> import { coins, simple } from "ZodGecko";
> const req = coins.schemas.MarketsRequestSchema.parse({ vs_currency: "usd" });
> ```

---

## Folder structure

Each endpoint group follows the same 4‑file pattern:

```

endpoints/
coins/
schemas.ts     # Zod schemas (runtime validation)
requests.ts    # Type aliases inferred from schemas
responses.ts   # Type aliases inferred from schemas
index.ts       # Public barrel for the group
README.md      # (optional) endpoint-specific notes
**tests**/     # (optional) unit tests (vitest/jest)

```

**Why this split?**

- `schemas.ts`: runtime validation is here; it’s the single source of truth.
- `requests.ts` / `responses.ts`: type‑only re-exports or `z.infer` aliases; zero runtime code.
- `index.ts`: public surface for the group; re-exports types and exposes the `schemas` namespace.

---

## Conventions

- **JSDoc headers**  
  Every file starts with `@file` and `@module`:
  ```ts
  /**
   * @file src/endpoints/coins/schemas.ts
   * @module coins.schemas
   */
  ```

* **Value vs. type exports**
  With `verbatimModuleSyntax: true`, split value and type exports:

  ```ts
  export { MarketsResponseSchema } from "./schemas"; // value
  export type { MarketsResponse } from "./responses"; // type
  ```

* **Dependencies**
  - Use `@core/*` modules (e.g., `VsCurrency`, `Pagination`, `CSList`, `tolerantObject`).
  - Do **not** import from other endpoint groups to avoid coupling.

* **Requests are strict**
  Request schemas use `.strict()`. Dynamic values (e.g., `vs_currency`) are provided by callers, not defaults in schemas.

* **Responses are tolerant**
  Response objects use `tolerantObject(shape)` (i.e., `z.object(shape).catchall(z.unknown())`) so upstream field additions don’t break parsing.

* **URL fields**
  Use `UrlString` from `core/primitives` (not `z.string().url()`).

* **CSV inputs**
  For CSV query params, use `CSList(inner?)` to accept `string | string[]` and output stable CSV.

---

## File roles

### `schemas.ts`

- Defines all **runtime Zod schemas** (requests + responses).
- Can import from `core/common` and `core/primitives`.
- Keep minimal per‑endpoint logic; reuse shared fragments where possible.

### `requests.ts`

- Type aliases only:

  ```ts
  export type MarketsRequest = z.infer<typeof MarketsRequestSchema>;
  ```

- No runtime code (helps DCE and bundlers).

### `responses.ts`

- Type aliases only:

  ```ts
  export type MarketsResponse = z.infer<typeof MarketsResponseSchema>;
  ```

- Optionally export row/item types for UI/tests.

### `index.ts`

- Public surface for the group:

  ```ts
  export type { MarketsRequest } from "./requests";
  export type { MarketsResponse } from "./responses";
  export * as schemas from "./schemas";
  ```

---

## Example usage

```ts
import { coins, buildQuery } from "ZodGecko";

// Validate request
const req = coins.schemas.MarketsRequestSchema.parse({
  vs_currency: "usd",
  ids: ["bitcoin", "ethereum"],
});

// Serialize (defaults dropped; keys alphabetized)
const qs = new URLSearchParams(buildQuery("/coins/markets", req)).toString();
// → "ids=bitcoin%2Cethereum&vs_currency=usd"

// Fetch & validate response
const res = await fetch(`${baseUrl}/coins/markets?${qs}`);
const data = coins.schemas.MarketsResponseSchema.parse(await res.json());
```

---

## JSDoc checklist (per file)

- `schemas.ts`
  - `@file` + `@module` header
  - For each endpoint:
    - `@endpoint` with HTTP path
    - `@summary` of purpose
    - Notes on optional/nullable fields if relevant

- `requests.ts` / `responses.ts`
  - `@file` + `@module` header
  - One‑line description of types exported

- `index.ts`
  - `@file` + `@module` header
  - Clarify that `schemas` is the runtime surface

---

## Testing (optional)

Place tests in each group under `__tests__/`:

- `requests.test.ts` — round‑trip parse + `buildQuery` behavior
- `responses.test.ts` — fixture parse (tolerant to extras)
- Reuse `src/testing/` helpers for fixtures and custom matchers

---

## Do’s & Don’ts

- ✅ **Do** reuse shared fragments (`Pagination`, `IdsNamesSymbolsTokens`, `PrecisionString`, etc.).
- ✅ **Do** keep request schemas strict and response schemas tolerant.
- ✅ **Do** make CSV params stable via `CSList` (sorted/deduped).
- ❌ **Don’t** set defaults in request schemas that may mask missing params.
- ❌ **Don’t** import across endpoint groups.
- ❌ **Don’t** use `z.string().url()`; use `UrlString`.

---

## Adding a new endpoint group

1. Create `endpoints/<group>/` with `schemas.ts`, `requests.ts`, `responses.ts`, `index.ts`.
2. Implement schemas with shared fragments from `core/`.
3. Add a barrel export to `endpoints/index.ts`:

   ```ts
   export * as <group> from "./<group>";
   ```

4. (Optional) Add tests and a short `README.md` in the group folder.

---

This structure keeps schemas modular, types tree‑shakable, and your public API surface predictable.
