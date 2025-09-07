# Contributing to ZodGecko

First off, thanks for taking the time to contribute! 🎉
This library is a **hobby project** maintained on a best-efforts basis. Contributions are welcome—please follow the guidelines below to keep things consistent.

---

## Getting Started

1. **Fork** the repo and clone it locally.
2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Generate the registry (required before tests):

   ```sh
   pnpm gen:registry
   ```

4. Run typecheck, lint, and tests:

   ```sh
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

> For detailed testing conventions and folder layout, see **TESTING.md** (authoritative).

---

## Project Structure

```
src/
  client/        # no-network client (ZodGecko, createClient, defaults)
  fetch/         # optional minimal fetch client (subpath import)
  helpers/       # format-params, format-path, parse-*, get-schemas, to-url, explain-error
  registry/      # generated.ts + accessors/selectors/path-from-slug/types
  schemas/       # <endpoint-slug>/<version>/<plan>/{index,request,response}.ts
  testkit/       # discovery/fs/run + fixtures
    fixtures/<version>/<plan>/<endpoint>/{defaults,scenarios}/*.json
```

Notes:

- **No** `utils/` bucket: helpers are colocated or live in `helpers/`.
- Endpoints are referenced by **slug** (e.g., `coins.by-id.history`).
- Path params appear as `by-*` segments in slugs (e.g., `simple.token_price.by-id`).

---

## Rules & Conventions

- **Requests**: always `strict()` and aligned with CoinGecko docs.
- **Responses**: always tolerant via `.catchall(z.unknown())` to survive new upstream fields.
- Shared schema fragments belong in `src/schemas/_shared/*`.
- PRs must not commit a stale `src/registry/generated.ts`.
- Add fixtures in `testkit/fixtures` where possible to cover new endpoints.

---

## Coding Standards

- **TypeScript strict** mode is on.
- **ESM** with explicit `.js` specifiers.
- Prefer branded primitives (`CoinId`, `VsCurrency`) over raw strings.
- Alphabetize object keys where practical for cleaner diffs.
- No `any`; use `unknown` + type narrowing.
- Explicit return types (incl. generators).
- Keep imports grouped (external vs internal), alphabetized.

---

## House JS Doc Style

### 1) Required file header (every `.ts` file)

Place a header **at the very top** of every TypeScript source file (excluding generated files). The three tags are mandatory.

```ts
/**
 * @file src/path/to/file.ts
 * @module path/to/file
 * @summary One-sentence summary in sentence case, ends with a period.
 */
```

- `@file` — repo-relative path.
- `@module` — path after `src/` (no extension).
- `@summary` — single sentence.

> **Schemas are special:** For `src/schemas/**`, we only enforce this **top-of-file header**. Additional, richer endpoint docs within schema files are allowed and not linted.

---

### 2) Functions (named or `export const foo = (...) => ...`)

Order of tags: **`@param` → `@returns` → `@throws` → `@example`**.
Use an en dash `–` between the type block and description.

```ts
/**
 * One-sentence summary in sentence case, ends with a period.
 *
 * @param id (required: string) – User ID to fetch.
 * @param limit (optional: number) [default=50] – Max items to return.
 * @param flags (required: { quiet?: boolean }) – Behavior switches.
 * @returns Promise<User[]> – The matching users.
 * @throws NotFoundError – When the user doesn’t exist.
 * @example
 * const users = await listUsers("42", { quiet: true });
 */
export function listUsers(id: string, limit = 50, flags: { quiet?: boolean }) {
  /* ... */
}
```

**Rules**

- **`@param`** (one per parameter, declared order):
  - Format: `@param <name> (required|optional: <TYPE>) [default=VALUE] – <description>`
  - Optional params use `optional` (question token or default value).
  - Include `[default=VALUE]` immediately after the type block when a default exists.
  - Rest params: `@param ...parts (optional: string[]) – ...`

- **`@returns`**:
  - Omit if the effective return is `void` or `Promise<void>`.
  - Otherwise: `@returns <TYPE> – <description>`

- **`@throws`**: one line per domain error (optional).
- **`@example`**: short, runnable snippet (optional).

> When types are extremely complex, prefer concise forms (e.g., `Record<string, string>` → keep; giant conditional types → summarize as `object` and rely on IDE hover types).

---

### 3) Exported consts (non-function values)

If the export is a function in a const (`export const fn = (...) => ...`), follow the **Function** rules instead. For non-functions:

```ts
/**
 * Map of plan → base API URL.
 * @remarks Type: Readonly<Record<Plan, string>>
 * @example
 * const base = DEFAULT_BASE_FOR["public"];
 */
export const DEFAULT_BASE_FOR = Object.freeze({ public: "...", paid: "..." } as const);
```

**Rules**

- Mandatory **one-line summary** (can be followed by additional paragraphs if needed).
- Use `@remarks Type:` when the inferred type is helpful to readers. If the type is excessively long, prefer a short description (e.g., `@remarks Type: complex object; see source`).
- Optional `@example`.

---

### 4) Exported types & interfaces

Use one `@property` per field for object shapes (type alias or interface). Keep the same “required/optional” and default notation used for functions.

```ts
/**
 * Request parameters for the search endpoint.
 *
 * @property query (required: string) – Search phrase.
 * @property page (optional: number) [default=1] – Page number.
 * @property tags (optional: string[]) – Optional filter tags.
 */
export type SearchParams = {
  query: string;
  page?: number;
  tags?: string[];
};
```

Interface example:

```ts
/**
 * Normalized response row for coin listings.
 *
 * @property id (required: string)
 * @property symbol (required: string)
 * @property name (required: string)
 */
export interface CoinRow {
  id: string;
  symbol: string;
  name: string;
}
```

**Rules**

- **Summary**: one sentence.
- **`@property`** (declared order):
  - Format: `@property <name> (required|optional: <TYPE>) [default=VALUE] – <description>`
  - Optional fields use `optional` (question token).
  - If a sensible default is part of the contract, include `[default=VALUE]`.

- **Literal unions** may be shown inline:
  `@property order (optional: "asc" | "desc") – Sort order.`
- Multiline descriptions: start on the same line and continue with hanging indent.

---

### 5) Unions, intersections, and enums

When the exported **type** is a union/intersection rather than an object, summarize the variants. For **enums**, list members.

Union / intersection:

```ts
/**
 * Result of parsing a price value.
 *
 * @remarks Variants:
 * - number – Parsed numeric price.
 * - "N/A" – Unavailable.
 */
export type PriceValue = number | "N/A";
```

Enum:

```ts
/**
 * Known plan codes.
 *
 * @remarks Members:
 * - Public
 * - Paid
 */
export enum Plan {
  Public = "public",
  Paid = "paid",
}
```

---

### 6) Generics and type parameters

When documenting generics, add `@typeParam` entries:

```ts
/**
 * Wraps a value or an error.
 *
 * @typeParam T – Success value type.
 * @typeParam E – Error type (defaults to Error).
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

---

### 7) Linting & automation

- **Header check/fix**
  - `pnpm check:tsdoc` / `pnpm fix:tsdoc`
  - Enforces the top-of-file header. For `src/schemas/**`, only this header is enforced; deeper schema docs are left as-is.

- **Export docs check/fix**
  - `pnpm check:exports` / `pnpm fix:exports`
  - Ensures:
    - Functions: `@param` (with `(required|optional: TYPE)` and `[default=…]`), `@returns` when non-void.
    - Consts: summary (+ `@remarks Type:` when helpful).
    - Types/interfaces: `@property` per field; unions/enums summarized under `@remarks`.

**Heuristics**

- Scripts derive names, optionality, defaults, and types via the TypeScript compiler API.
- When types are **overly complex** (deep generics/conditionals or very long), scripts fall back to compact labels (e.g., `object`, `Array<…>`) and/or `@remarks Type: complex; see source`.
- `@throws` and `@example` are author-maintained.

---

### 8) Copy-paste templates

**Function**

```ts
/**
 * <Summary>.
 *
 * @param name (required: string) – <desc>.
 * @param count (optional: number) [default=0] – <desc>.
 * @returns Promise<Result> – <desc>.
 */
export async function doThing(name: string, count = 0) {
  /* ... */
}
```

**Const**

```ts
/**
 * <Summary>.
 * @remarks Type: Readonly<Record<string, number>>
 */
export const LOOKUP = Object.freeze({
  /* ... */
} as const);
```

**Type / Interface**

```ts
/**
 * <Summary>.
 *
 * @property foo (required: string) – <desc>.
 * @property bar (optional: number) [default=1] – <desc>.
 */
export interface Example {
  foo: string;
  bar?: number;
}
```

Adopting these rules gives us uniform, high-signal docs that play nicely with IDEs and our automated checks.

---

## Generated docs

- Registry is the **single source of truth**.
- Always regenerate docs/registry after schema changes:

  ```sh
  pnpm gen:registry
  pnpm check:registry
  ```

---

## Tests

- **Helpers/registry**: unit tests under `src/helpers/__tests__` and `src/registry/__tests__`.
- **Fixtures runner**: `src/testkit/fixtures/runner.spec.ts` auto-discovers per-endpoint fixtures.
- **Fixtures**: JSON only, minimal, never mutated. Placed under `testkit/fixtures/<version>/<plan>/<endpoint>/`.

### Coverage expectations

- **Requests**: happy path + strictness.
- **Responses**: tolerant parsing, unknown preservation.
- **Serialization**: CSV normalization, boolean/number coercion.
- **Sanity**: schema defaults vs registry defaults.

---

## Pull Requests

- Keep changes small and incremental.
- Always:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:coverage`
  - `pnpm check:registry`
  - `pnpm check:tsdoc`

- Include a brief description of what/why.

Thank you! 🙂
