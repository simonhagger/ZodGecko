# Contributing to ZodGecko

First off, thanks for taking the time to contribute! 🎉  
This library is a **hobby project** maintained on a best-efforts basis.  
Contributions are welcome, but please follow the guidelines below to keep things consistent.

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

4. Run linting and formatting (if configured):

   ```sh
   npm run lint
   npm run format
   ```

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
- **Responses**: always `catchall(z.unknown())` (tolerant to new fields).
- **Shared bits**: if multiple endpoints repeat a pattern, move it to `core/common.ts`.

---

## Coding Standards

- **TypeScript** strict mode enabled (`--strict`).
- **Zod schemas** must have comments or JSDoc for clarity.
- Prefer **branded primitives** (`CoinId`, `VsCurrency`) over raw strings.
- Use **`UrlString`** instead of `z.string().url()` (to handle `http` and empty strings).
- Use **alphabetical order** for object keys where possible, for diff clarity.

---

## JSDoc & Documentation

- Every file starts with:

  ```ts
  /**
   * @file src/endpoints/coins/schemas.ts
   * @module endpoints/coins/schemas
   *
   * Short description of what lives here.
   */
  ```

- Keep endpoint-specific **README.md** short, with examples.

---

## Tests

We are building toward **comprehensive tests per endpoint**.

- Place tests in `src/endpoints/__tests__/<endpoint>/`.
- Test both **request parsing** and **response validation**.
- Mock responses using minimal fixtures.
- For query serialization, test `buildQuery` with defaults.

* Use `z.input<typeof Schema>` for request literals; call `schema.parse(value)` only inside `expectValid/expectInvalid`.
* Never read fields from `unknown`. Validate with small zod snippets (`safeParse`) or check presence via `isObjectRecord(...) && hasOwnProperty(...)`.
* For `{id}` routes, use `dropId(req)` before `buildQuery()`.
* Keep default-dropping assertions out of per-route tests; rely on the `*.sanity.functional.test.ts`.
* Helpers live in `__tests__/_utils` and are excluded from coverage; include `/* c8 ignore file */` at the top.
* Fixtures live beside their route; it’s fine to use minimal inline payloads for “tolerance” checks (don’t mutate fixtures).
* Test titles read like the spec: _“normalizes X…”, “keeps Y…”, “rejects invalid Z”_.

---

## Submitting a Pull Request

1. Ensure `npm run typecheck` passes.
2. Ensure new schemas/changes are documented with JSDoc.
3. Add/update tests if relevant.
4. Keep PRs focused (one endpoint or one feature at a time).
5. Open a PR with a clear description of what changed.

---

## Questions?

- Open a **Discussion** on GitHub for design topics.
- Open an **Issue** for bugs or schema mismatches.

---

Thanks for helping make ZodGecko better! 🚀
