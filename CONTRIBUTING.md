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
  core/        # Shared primitives and fragments (Zod types, helpers)
  runtime/     # buildQuery, serverDefaults
  endpoints/   # One folder per API group (coins, exchanges, ...)
    schemas.ts     # Zod schemas (runtime validation)
    requests.ts    # inferred request types
    responses.ts   # inferred response types
    index.ts       # public barrel
    README.md      # (optional) endpoint docs
```

### Rules

- **Requests**: always `strict()` and aligned with CoinGecko docs.
- **Responses**: always tolerant via `.catchall(z.unknown())` to survive new upstream fields.
- **Shared bits**: if multiple endpoints repeat a pattern, move it to `core/common.ts`.

---

## Coding Standards

- **TypeScript** strict mode is on.
- **Zod schemas** include comments / JSDoc for clarity.
- Prefer **branded primitives** (e.g., `CoinId`, `VsCurrency`) over raw strings.
- Use `UrlString` helper where applicable.
- Alphabetize object keys where practical for cleaner diffs.

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

Keep endpoint-specific docs short and example-driven.

---

## Tests

We’re building **comprehensive tests per endpoint**. See **TESTING.md** for specifics.

- **Location**: `src/endpoints/__tests__/<endpoint>/`
  - e.g., `src/endpoints/__tests__/coins/coins.requests.test.ts`

- **Shape**:
  - **Requests**: valid/invalid shapes, CSV normalization, enum checks.
  - **Responses**: tolerant parsing with minimal fixtures.
  - **Functional**: buildQuery serialization + default-dropping.
  - **Sanity**: tiny guardrails for “no params/defaults” routes.

- **Fixtures**: keep them minimal and never mutate in tests (see TESTING.md for guidance).

---

## Pull Requests

- Keep changes focused.
- Add/adjust tests with the patterns above.
- Ensure `npm run typecheck`, `npm run lint`, and `npm run test:coverage` are green.
- Include a brief PR description (what/why).

Thank you! 🙂
