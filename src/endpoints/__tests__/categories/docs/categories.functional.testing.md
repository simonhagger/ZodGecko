# Categories – Functional Testing

**Routes (HTTP)**  
Although grouped under “categories” in our source, the HTTP paths live under **`/coins/*`**:

- `GET /coins/categories` — category market data (array of category rows)
- `GET /coins/categories/list` — minimal list of category ids/names

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/categories/
├─ docs/
│  └─ categories.functional.testing.md        ← this file
├─ fixtures/
│  ├─ categories.response.json                ← market data payload
│  └─ categories.list.response.json           ← list payload
├─ categories.requests.test.ts                ← request shape & serialization
├─ categories.responses.test.ts               ← response parsing & tolerance
├─ categories.functional.test.ts              ← /coins/categories behavior
├─ categories.list.functional.test.ts         ← /coins/categories/list behavior
└─ categories.sanity.functional.test.ts       ← route-level sanity checks

```

- Keep fixtures **small** and immutable; do not mutate fixtures in tests.
- If the two routes share the same shape (they don’t today), consider consolidating fixtures. Otherwise, keep per-route JSON.

---

## What these routes must do

### `/coins/categories`

- **Params**: may accept an optional `order` (enum). No other inputs are used here.
- **Server defaults**: **none serialized by us**. If upstream has a server default, we do **not** inject it—only serialize what callers provide.
- **Responses**: tolerant array of category rows.
  - Essentials typically include: `id: string`, `name: string`, plus numeric metrics (e.g., `market_cap`, `market_cap_change_24h`, `volume_24h`) which are numbers if present.
  - Unknown fields on a row are preserved.

### `/coins/categories/list`

- **Params**: none.
- **Server defaults**: none.
- **Responses**: tolerant array of minimal rows.
  - Essentials: `category_id: string`, `name: string` (naming aligns with our schema).
  - Unknown fields on a row are preserved.

---

## Test intentions

### Requests (`categories.requests.test.ts`)

- **Strictness**: unknown keys are rejected (schema is strict).
- **Optional enum**: valid `order` is accepted and serialized; invalid enum is rejected.
- **No implicit defaults**: empty object stays empty (we don’t invent `order`).

### Functional

- **`categories.functional.test.ts` ( `/coins/categories` )**
  - When `order` is provided and valid → appears verbatim in the serialized query.
  - With `{}` → serialized query is `{}` (no params).
- **`categories.list.functional.test.ts` ( `/coins/categories/list` )**
  - No params: `{}` → `{}`.
  - Guard against accidental defaults creeping in.

### Responses (`categories.responses.test.ts`)

- **Market data fixture** parses to a non-empty array; essentials on the first row validate (id/name as strings; numeric metrics as numbers when present).
- **List fixture** parses to a non-empty array; essentials validate (`category_id`, `name` as strings).
- **Tolerance**: for each route, prove unknown keys survive on a row (checked via safe object guard + `hasOwnProperty`).

### Sanity (`categories.sanity.functional.test.ts`)

- Serializer baseline for both routes:
  - `/coins/categories` with `{}` → `{}`.
  - `/coins/categories/list` with `{}` → `{}`.
- If upstream later documents client-visible defaults that we choose to surface via schema defaults, add a parallel “parsed {} → defaults” check. Until then, the serializer baseline is the single source of truth.

---

## Fixtures

- **Location**
  - `src/endpoints/__tests__/categories/fixtures/categories.response.json`
  - `src/endpoints/__tests__/categories/fixtures/categories.list.response.json`
- **Content**
  - Smallest viable arrays.
  - Stable values (small numbers, fixed timestamps if any).
  - Include a single harmless unknown key on **one** row per fixture to prove tolerance.
- **Do not** mutate fixtures in tests. If you need a variant, add a second tiny fixture or build an inline payload in the test.

---

## Maintainer notes

- If upstream adds additional request params (e.g., pagination or filters), introduce them in the request schema, extend the **requests** test to cover serialization, and add/bump a **sanity** assertion if defaults become schema-level.
- If upstream tightens or changes field names in responses, adjust the essentials list above and the small guards in the responses test. The tolerance check should remain green unless the entire envelope/shape changes.
