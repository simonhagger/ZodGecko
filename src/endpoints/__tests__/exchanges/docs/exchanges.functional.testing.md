# Exchanges – Functional Testing

**Routes (HTTP)**

- `GET /exchanges`
- `GET /exchanges/list`
- `GET /exchanges/{id}`

> Path params (`{id}`) are **not** serialized into the query.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/exchanges/
├─ docs/
│  └─ exchanges.functional.testing.md            ← this file
├─ fixtures/
│  ├─ exchanges.response.json                    ← /exchanges payload
│  ├─ exchanges.list.response.json               ← /exchanges/list payload
│  └─ exchanges.by-id.response.json              ← /exchanges/{id} payload
├─ exchanges.requests.test.ts                    ← request shape & serialization
├─ exchanges.responses.test.ts                   ← response parsing & tolerance
├─ exchanges.functional.test.ts                  ← /exchanges behavior
├─ exchanges.list.functional.test.ts             ← /exchanges/list behavior
├─ exchanges.by-id.functional.test.ts            ← /exchanges/{id} behavior
└─ exchanges.sanity.functional.test.ts           ← route-level sanity checks

```

- Keep fixtures **small** and immutable; don’t mutate fixtures in tests.
- One fixture per distinct response shape.

---

## What these routes must do

### `/exchanges`

- **Params**: pagination only (as modeled by our schema):
  - `per_page` (number)
  - `page` (number)
- **Serialization**: numbers → strings.
- **Server defaults**: none injected by us; we only serialize what callers provide.
- **Response**: tolerant array of exchange rows (unknown fields preserved).

### `/exchanges/list`

- **Params**: none.
- **Server defaults**: none.
- **Response**: tolerant array of minimal rows (e.g., `id`, `name`); unknown fields preserved.

### `/exchanges/{id}`

- **Params**: path-only (`{id}`); **no query**.
- **Server defaults**: none.
- **Response**: tolerant object/row describing the exchange id; unknown fields preserved.

---

## Test intentions

### Requests (`exchanges.requests.test.ts`)

- **Strictness**: unknown keys are rejected where the route accepts known inputs.
- **Serialization**: for `/exchanges`, `per_page` & `page` normalize to strings.
- **No implicit defaults**: empty objects stay empty—we don’t invent pagination.

### Functional

- **`exchanges.functional.test.ts` ( `/exchanges` )**
  - With `{ per_page, page }`, serialized query uses numbers as strings.
  - With `{}`, serialized query is `{}` (no defaults).
- **`exchanges.list.functional.test.ts` ( `/exchanges/list` )**
  - No params: `{}` → `{}`.
- **`exchanges.by-id.functional.test.ts` ( `/exchanges/{id}` )**
  - Drop path param before serialization → `{}`; guard against accidental defaults.

### Responses (`exchanges.responses.test.ts`)

- **/exchanges fixture** parses to a non-empty array; essentials on first row validate; unknown row fields are preserved.
- **/exchanges/list fixture** parses to a non-empty array; essentials validate on minimal rows; unknown row fields preserved.
- **/exchanges/{id} fixture** parses to an object/row; essentials validate; unknowns preserved (checked safely).

### Sanity (`exchanges.sanity.functional.test.ts`)

- **Serializer baseline** for all three routes:
  - `/exchanges` with `{}` → `{}`.
  - `/exchanges/list` with `{}` → `{}`.
  - `/exchanges/{id}` (drop path param) → `{}`.

---

## Fixtures

- **Location**: see file map under `fixtures/`.
- **Content**:
  - Smallest viable objects/arrays accepted by the schemas.
  - Stable, readable values.
  - Add at most one harmless unknown key at the tolerant level (row or envelope) to prove preservation.
- **Never mutate fixtures** in tests; for variants, add a second tiny fixture or build an inline payload.

---

## Maintainer notes

- If upstream adds additional filters (e.g., country, trust score), introduce them in the request schema and extend **requests** + **functional** tests to assert serialization and behavior.
- If upstream changes response shapes (adds/removes fields), update the schema and the “essentials” checks. Tolerance assertions should remain green unless the envelope/shape fundamentally changes.
- Keep to the helper convention (`dropId`) in the by-id functional/request tests to avoid lint churn and keep intent obvious.
