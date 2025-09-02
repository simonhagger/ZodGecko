Totally—here’s a clear way to think about **`meta`** in each schema variant, why it exists, and exactly how it’s used by the registry generator.

---

## What is `meta`?

A tiny, declarative object you export **alongside** your Zod schemas that captures the **bits Zod can’t know**—primarily the HTTP path.

```ts
// src/schemas/coins.by-id/v3.0.1/public/index.ts
export const meta = {
  pathTemplate: "/coins/{id}",
  method: "GET", // optional (defaults to GET)
} as const;
```

### Why do we need it?

- **Zod knows shapes**, not URLs. Your `requestSchema.path` can tell us there’s an `id`, but not _where_ it appears (`/coins/{id}` vs `/assets/{id}`) or the segment order.
- **We want no guessing.** Slugs are human-chosen; we don’t want to synthesize URLs from slugs.
- **Strong defaults without boilerplate.** One string gives us:
  - The exact route (joined with base later).
  - The set of **required path params** (extracted from `{…}`).
  - A stable source of truth across versions/plans.

That’s it. We keep `meta` intentionally minimal to avoid duplication.

---

## How the generator uses `meta`

Given your exported `meta`, `requestSchema`, and `responseSchema`, the generator:

1. **Finds variants** by folder:

   ```
   src/schemas/<slug>/<version>/<plan>/index.ts
   ```

   (e.g., `coins.by-id/v3.0.1/public/index.ts`)

2. **Reads `meta.pathTemplate`** to:
   - Store the template verbatim (no normalization).
   - Compute `requiredPath` by scanning `{param}` tokens → `["id"]`.

3. **Infers query rules from Zod** (no manual `queryRules`):
   - Looks for `requestSchema.query` (a `z.object({ … })`).
   - For each key:
     - If it has `.default(...)`, capture the default value.
     - If it’s an array and you annotated it with `qCsv(...)`, mark `arrayEncoding: "csv"`.
     - If you wrapped with `qKeep(...)`, set `dropWhenDefault: false`. Otherwise defaults to `true`.

4. **Emits a `registry/generated.ts` entry** that contains:
   - `id` (the slug)
   - `validFor` (from folder)
   - `method` (uppercased; default GET)
   - `pathTemplate` & `requiredPath`
   - `queryRules` (derived)
   - `requestSchema` / `responseSchema` references

This means you keep writing Zod once, plus a **one-line** `pathTemplate`, and the registry is rebuilt automatically.

---

## Recommended shapes in your schema module

### Minimal variant

```ts
// src/schemas/simple.price/v3.0.1/public/index.ts
import { z } from "zod";
import { qCsv, qKeep } from "../../_shared/q.js";

export const meta = {
  pathTemplate: "/simple/price",
} as const;

export const requestSchema = z.object({
  // GET has no body; we still model path/query for normalization
  path: z.object({}).default({}),
  query: z.object({
    ids: qCsv(z.array(z.string())).default([]), // CSV array, default []
    vs_currencies: qCsv(z.array(z.string())).default([]),
    include_market_cap: z.boolean().default(false),
    lang: qKeep(z.string().default("en")), // keep even when default
  }),
});

export const responseSchema = z.record(
  z.string(),
  z.object({
    usd: z.number().optional(),
    // …
  }),
);
```

### With path parameters

```ts
// src/schemas/coins.by-id.history/v3.0.1/public/index.ts
import { z } from "zod";

export const meta = {
  pathTemplate: "/coins/{id}/history",
} as const;

export const requestSchema = z.object({
  path: z.object({ id: z.string() }),
  query: z.object({
    date: z.string(), // dd-mm-yyyy per docs
    localization: z.boolean().default(false),
  }),
});

export const responseSchema = z.object({
  // …
});
```

### Paid re-exports public (identical shape)

```ts
// src/schemas/coins.by-id/v3.1.1/paid/index.ts
export { meta, requestSchema, responseSchema } from "../../v3.0.1/public/index.js";
```

---

## Guardrails & conventions

- **Template must be exact** (match the CG docs path, no base URL, no trailing slash normalization).
- **Param names in `{…}` must match `requestSchema.path` keys.**
  - If docs use `{coin_id}` for a specific route, prefer that over `{id}` to stay accurate.

- **Method is optional** and defaults to `"GET"`. Specify only when **not** GET.
- **Do not encode defaults in the schema objects** (beyond Zod’s `.default(...)`). Server defaults are auto-derived from those defaults for **query serialization**, not for response validation.
- **Annotate query arrays** with `qCsv(z.array(...))` to mark CSV encoding.
  - `qKeep(z.string().default("en"))` marks a param as **not dropped** when equal to default.

### Optional validation (nice to have)

- We can add a generator check that:
  - Compares `{…}` tokens from `pathTemplate` with `Object.keys(requestSchema.shape.path)` and fails if sets differ (catches drift).
  - Validates slug naming (your `by-<param>` convention) and that those params appear in the template.

---

## Quick authoring checklist (per variant)

1. Create/confirm folder: `src/schemas/<slug>/<version>/<plan>/index.ts`.
2. Add:
   - `export const meta = { pathTemplate: "<exact path>", method?: "<GET|POST|...>" } as const;`
   - `export const requestSchema = z.object({ path: z.object({...}), query: z.object({...}) });`
     - Use `qCsv(...)` for arrays that serialize as CSV.
     - Use `.default(...)` to capture server defaults.
     - Use `qKeep(...)` for params that must **not** be dropped when defaulted.

   - `export const responseSchema = z.object({...});`

3. If the paid (or other) variant is identical, **re-export** from the default variant.
4. Run `pnpm gen:registry` to regenerate `src/registry/generated.ts`.
5. Run tests; the fixture runner will validate the variant with your existing defaults/scenarios.

---

## Mental model: what lives where?

- **`meta.pathTemplate`** — the **route** (cannot be inferred from Zod).
- **`requestSchema.path`** — the **keys** for `{…}` placeholders (type-checked).
- **`requestSchema.query`** — the **shape**, **defaults**, and optional **encoding hints**.
- **`responseSchema`** — the runtime validation target.
- **Registry** — **generated** from the above (no manual entries/`queryRules` maintenance).

This keeps your authoring surface tiny (path + Zod), and lets the generator produce a complete, typed registry for the client to use.
