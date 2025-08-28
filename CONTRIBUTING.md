# Contributing to ZodGecko

Thanks for helping improve ZodGecko! This doc is for **repo contributors** (kept out of the npm package).

## Quick Start

```bash
# install
pnpm i    # or: npm i / yarn

# typecheck + unit tests + examples build + doc checks
npm run verify:docs
```

### Useful scripts

- `npm run docs:inventory` — generate `docs/endpoint-inventory.md` + JSON sidecar.
- `npm run check:inventory` — verify the inventory matches the code.
- `npm run check:deps` — circular dependency check.
- `npm run check:tsdoc` — TSDoc coverage check.
- `npm run check:zod` — zod usage/version sanity checks.
- `npm run check:examples` — typecheck examples (see `examples/basic-usage.ts`).

### Focused debug

```bash
# verbose across all endpoints
npx tsx scripts/generate-endpoint-inventory-docs.ts --debug

# verbose for one endpoint
npx tsx scripts/generate-endpoint-inventory-docs.ts --endpoint="/coins/{id}/history"
```

> On some npm versions (especially Windows), pass flags directly via `npx tsx` to avoid npm swallowing them.

---

## Source of Truth: Endpoint Catalogue

The **only** canonical list of supported endpoints and their shapes is:

- `docs/endpoint-inventory.md` (human-readable)
- `docs/endpoint-inventory.json` (machine-readable)

These are **generated from code** (request schemas + `SERVER_DEFAULTS`) and parity-checked in CI. We intentionally removed older duplicate docs (`endpoints.md`, `server-defaults.md`, `required-params.md`).

### When you change schemas or defaults

1. Update request/response schemas or `SERVER_DEFAULTS`.
2. Run `npm run docs:inventory`.
3. Commit the updated `docs/endpoint-inventory.*` files.
4. Ensure `npm run check:inventory` passes.

---

## Coding Standards

- **TypeScript**
  - Aim for `strict` correctness (consider enabling `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` where feasible).
  - Prefer ESM (`"type": "module"`) semantics.

- **Zod**
  - **Zod v4 only.** Do not import `ZodIssue` or use v3 aliases.
  - Request schemas should be **ZodObject** at the top level when possible. If not, document why in TSDoc.

- **Docs Generators**
  - Cross-platform (Windows-friendly). Avoid bash-only scripts.
  - Accept `--debug` / `--endpoint=…` flags; avoid environment-variable toggles.

---

## TSDoc Guidelines

We enforce TSDoc on exported items. For exported constants and branded types, use full-block comments:

```ts
/** Branded string for Coin IDs (e.g. "bitcoin"). */
export const CoinId = brand(NonEmptyString, "CoinId");
```

Prefer `/** … */` over `//` comments to satisfy TSDoc checks.

---

## Examples

- Keep `examples/basic-usage.ts` compiling (no runtime fetch).
- If you add examples:
  - Target the **type system** (build-only).
  - Avoid network calls; use `toURL`, `formatPath`, etc.

---

## Commit / PR Checklist

- [ ] Updated schemas and/or `SERVER_DEFAULTS` as needed.
- [ ] Ran `npm run docs:inventory` and committed updated `docs/endpoint-inventory.md` and `.json`.
- [ ] `npm run check:inventory` passes.
- [ ] `npm run check:tsdoc` passes (add missing TSDoc if flagged).
- [ ] `npm run check:examples` passes.
- [ ] Tests/linters green locally.

(Optional) Add a pre-commit hook:

```bash
npx husky add .husky/pre-commit "npm run docs:inventory && git add docs/endpoint-inventory.*"
```

---

## Windows Notes

- Use `npx tsx scripts/… --debug` for script flags.
- Avoid `bash` scripts; use Node/TS (`tsx`) or cross-platform shell.
