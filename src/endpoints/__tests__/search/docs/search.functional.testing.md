# Search – Functional Testing

**Routes (HTTP)**

- `GET /search`
- `GET /search/trending`

> Path params: none. Query params: `/search` requires a **query string**; `/search/trending` has **no params**.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/search/
├─ docs/
│  └─ search.functional.testing.md                 ← this file
├─ fixtures/
│  ├─ search.response.json                         ← /search payload
│  └─ search.trending.response.json                ← /search/trending payload
├─ search.requests.test.ts                         ← request shape & serialization
├─ search.responses.test.ts                        ← response parsing & tolerance
├─ search.functional.test.ts                       ← /search behavior
├─ search.trending.functional.test.ts              ← /search/trending behavior
└─ search.sanity.functional.test.ts                ← route-level sanity checks

```

- Keep fixtures **small** and immutable; don’t mutate fixtures in tests.
- One fixture per route.

---

## What these routes must do

### `/search`

- **Params**: `{ query: string }` (required). Unknown keys rejected (strict request schema).
- **Server defaults**: none injected; we only serialize what callers provide.
- **Response**: tolerant **object** that can include arrays like `coins`, `exchanges`, etc. Unknown wrapper/item fields are preserved.

### `/search/trending`

- **Params**: none. `{}` serializes to `{}`.
- **Server defaults**: none.
- **Response**: tolerant **object** with a `coins: [{ item: {...} }]` style shape. Unknown wrapper/item fields are preserved.

---

## Test intentions

### Requests (`search.requests.test.ts`)

- `/search`: requires `query`; extras fail (strict). Serialized query mirrors the input `{ query }`.
- `/search/trending`: strict empty object; any key fails.

### Functional

- **`search.functional.test.ts`** (`/search`)
  - `{ query: "bitcoin" }` → serialized query `{ query: "bitcoin" }`.
  - Guard that nothing else is injected.
- **`search.trending.functional.test.ts`** (`/search/trending`)
  - `{}` → `{}`. Guard against accidental defaults or stray params.

### Responses (`search.responses.test.ts`)

- `/search` fixture parses; essentials validated (arrays present where modeled).  
  Prove tolerance: one harmless unknown key at the wrapper level (or in an item) survives.
- `/search/trending` fixture parses; essentials validated (`coins` with `item`).  
  Prove tolerance as above.

### Sanity (`search.sanity.functional.test.ts`)

- Serializer baselines:
  - `/search/trending` with `{}` → `{}`.
  - Optionally assert that `/search` without `query` fails validation (kept minimal).

---

## Fixtures

- **Location**
  - `src/endpoints/__tests__/search/fixtures/search.response.json`
  - `src/endpoints/__tests__/search/fixtures/search.trending.response.json`
- **Content**
  - Minimal, stable values (1–2 entries per array).
  - Include **one** unknown key (wrapper or item) to prove tolerance.
- **Do not** mutate fixtures in tests. For variants, add a second tiny fixture or construct a minimal inline payload.

---

## Maintainer notes

- If upstream adds new `/search` filters (e.g., category), introduce them in the request schema and extend **requests + functional** tests for serialization and strictness.
- If response arrays/keys shift (e.g., additional sections), update schemas and the essentials list; tolerance assertions should remain unless the envelope fundamentally changes.
