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

## Documentation

Every source file starts with a concise header:

```ts
/**
 * @file src/schemas/coins.by-id/request.ts
 * @module schemas/coins.by-id/request
 * @summary Request schema for coins.by-id endpoint.
 */
```

### Generated docs

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
