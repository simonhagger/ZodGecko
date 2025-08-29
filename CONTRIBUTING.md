# Contributing to ZodGecko

First off, thanks for taking the time to contribute! 🎉
This library is a **hobby project** maintained on a best-efforts basis.
Contributions are welcome—please follow the guidelines below to keep things consistent.

---

## Getting Started

1. **Fork** the repo and clone it locally.

2. Install dependencies:

   ```sh
   npm install
   ```

3. Run a type check to confirm your environment:

   ```sh
   npm run typecheck
   ```

4. Run linting and formatting:

   ```sh
   npm run lint
   npm run format
   ```

> For detailed testing conventions and folder layout, see **TESTING.md** (authoritative).

---

## Project Structure

```
src/
  core/              # primitives and helpers (Zod types, utils)
    __tests__/       # core unit tests
      common.cslist.test.ts
      common.utils.test.ts
      ddmmyyyy.test.ts
      explain-zod-error*.test.ts
      parse-utils*.test.ts
      primitives.urlstring.test.ts
      test-helpers.ts

  endpoints/         # one folder per API group (coins, exchanges, ...)
    __tests__/       # functional harness + shared helpers/fixtures
      _utils/
        assertions.ts
        defaults.ts
        fixtures.ts
        harness.ts          # EndpointHarness implementation
        index.ts
        normalize.ts
        path.ts
        schema.ts
      endpoints.functional.test.requirements.md
      endpoints.functional.test.ts   # single, over-arching functional suite
      fixtures/                      # shared JSON fixtures for many endpoints
        (see repo)

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

  runtime/           # query builder, URL helpers, defaults, validation, endpoint registry
    __tests__/
      drop-params.test.ts
      format-path.test.ts
      public-api.smoke.test.ts
      query.*.test.ts
      server-defaults.test.ts
      url.utils.test.ts
      validate.test.ts
      with-defaults.test.ts
    endpoints.ts     # registry of all endpoints
    index.ts
    query.ts
    server-defaults.ts
    url.ts
    validate.ts
    with-defaults.ts

src/index.ts         # package barrel (public API)

```

### Rules

- **Requests**: always `strict()` and aligned with CoinGecko docs.
- **Responses**: always tolerant via `.catchall(z.unknown())` to survive new upstream fields.
- **Shared bits**: if multiple endpoints repeat a pattern, move it to `core/common.ts`.
- **Harness**: endpoint functional tests run through (`src/endpoints/__tests__/endpoints.functional.test.ts`) using (`_utils/harness.ts`). Add endpoint-local tests only for edge cases or special fixtures.

---

## Coding Standards

- **TypeScript** strict mode is on (consider enabling `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`).
- **Zod schemas** include TSDoc for clarity.
- Prefer **branded primitives** (e.g., `CoinId`, `VsCurrency`) over raw strings.
- Use `UrlString` helper where applicable.
- Alphabetize object keys where practical for cleaner diffs.
- Write cross-platform scripts (Node/tsx, avoid bash-only).

---

## JSDoc & Documentation

Every source file starts with a concise file header:

```ts
/**
 * @file src/endpoints/coins/schemas.ts
 * @module endpoints/coins/schemas
 * @summary Zod schemas for Coins endpoints (requests/responses).
 */
```

Keep endpoint-specific docs short and example-driven. Internal contributor docs live in CONTRIBUTING.md and TESTING.md.

### Generated documentation

- **Endpoint Inventory** (`docs/endpoint-inventory.md` + `.json`) is the single source of truth.

- Always regenerate docs after schema or `SERVER_DEFAULTS` changes:

  ```sh
  npm run docs:inventory
  npm run check:inventory
  ```

- Commit the updated files. CI will fail if inventory is out of sync.

---

## Tests

See **TESTING.md** for detailed conventions.

- **Harness-driven**: all endpoints validated via `src/endpoints/__tests__/endpoints.functional.test.ts` (powered by `_utils/harness.ts`).
- **Core/runtime tests** live under their respective `__tests__` folders.
- **Fixtures**: JSON only, minimal, never mutated. Shared fixtures under `src/endpoints/__tests__/fixtures/`.

### What to cover

- **Requests**: happy path + strictness (reject unknowns, enums).
- **Responses**: tolerant parsing, Zod guard checks, unknown preservation.
- **Serialization**: CSV normalization, boolean/number coercion.
- **Sanity**: schema defaults vs serializer baseline.

---

## Pull Requests

- Keep changes focused and incremental.

- Add/adjust tests in line with conventions.

- Ensure:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:coverage`
  - `npm run check:inventory`
  - `npm run check:tsdoc`

- Include a brief PR description (what/why).

Thank you! 🙂
