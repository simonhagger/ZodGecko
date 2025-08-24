# Indexes – Functional Testing

**Routes (HTTP)**

- `GET /indexes`
- `GET /indexes/list`
- `GET /indexes/{id}`
- `GET /indexes/{market_id}/{id}` ← composite path params

> Path params are **not** serialized into the query. For the composite route, drop **both** `market_id` and `id` before serialization.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/indexes/
├─ docs/
│  └─ indexes.functional.testing.md                   ← this file
├─ fixtures/
│  ├─ indexes.response.json                           ← /indexes payload
│  ├─ indexes.list.response.json                      ← /indexes/list payload
│  ├─ indexes.by-id.response.json                     ← /indexes/{id} payload
│  └─ indexes.by-composite-id.response.json           ← /indexes/{market_id}/{id} payload
├─ indexes.requests.test.ts                           ← request shape & serialization
├─ indexes.responses.test.ts                          ← response parsing & tolerance
├─ indexes.functional.test.ts                         ← /indexes behavior
├─ indexes.list.functional.test.ts                    ← /indexes/list behavior
├─ indexes.by-id.functional.test.ts                   ← /indexes/{id} behavior
├─ indexes.by-composite-id.functional.test.ts         ← /indexes/{market_id}/{id} behavior
└─ indexes.sanity.functional.test.ts                  ← route-level sanity checks

```

- Keep fixtures **small** and immutable; don’t mutate fixtures in tests.
- Separate fixtures per route because shapes differ (list vs detail vs composite id).

---

## What these routes must do

### `/indexes`

- **Params**: pagination as modeled by our schema (e.g., `per_page`, `page`).
- **Serialization**: numbers → strings. No schema-injected defaults; only serialize what callers provide.
- **Response**: tolerant array of index rows.  
  Essentials typically include identifiers (e.g., `id`, `name`) and market metadata when provided; unknown row fields are preserved.

### `/indexes/list`

- **Params**: none.
- **Server defaults**: none.
- **Response**: tolerant array of minimal rows (ids/names), unknown row fields preserved.

### `/indexes/{id}`

- **Params**: path-only (`{id}`); **no query**.
- **Server defaults**: none.
- **Response**: tolerant detail object/row; unknown fields preserved.

### `/indexes/{market_id}/{id}` (composite)

- **Params**: path-only (`{market_id}`, `{id}`); **no query**.
- **Server defaults**: none.
- **Response**: tolerant detail object/row for the composite identifier; unknown fields preserved.

---

## Test intentions

### Requests (`indexes.requests.test.ts`)

- **Strictness**: unknown keys rejected on routes that accept params.
- **Serialization**: for `/indexes`, `per_page` and `page` normalize to strings.
- **No implicit defaults**: empty objects stay empty; we don’t invent pagination.
- **Path-only routes**: after dropping path params, serialized query is `{}` (by-id and composite routes).

### Functional

- **`indexes.functional.test.ts` ( `/indexes` )**
  - With `{ per_page, page }`, serialized query uses numbers as strings.
  - With `{}`, serialized query is `{}`.
- **`indexes.list.functional.test.ts` ( `/indexes/list` )**
  - No params: `{}` → `{}`.
- **`indexes.by-id.functional.test.ts` ( `/indexes/{id}` )**
  - Drop `{ id }` before serialization → `{}`; guard against accidental defaults.
- **`indexes.by-composite-id.functional.test.ts` ( `/indexes/{market_id}/{id}` )**
  - Drop **both** `{ market_id, id }` before serialization → `{}`.

### Responses (`indexes.responses.test.ts`)

- **/indexes fixture** parses to non-empty array; essentials on first row validate; unknown row fields preserved.
- **/indexes/list fixture** parses to non-empty array; essentials validate on minimal rows; unknown preserved.
- **/indexes/{id} fixture** parses to an object/row; essentials validate; unknown preserved.
- **/indexes/{market_id}/{id} fixture** parses similarly; unknown preserved.

### Sanity (`indexes.sanity.functional.test.ts`)

- **Serializer baseline**:
  - `/indexes` with `{}` → `{}`.
  - `/indexes/list` with `{}` → `{}`.
  - By-id and composite routes: drop path params → `{}`.

---

## Fixtures

- **Location**: see file map under `fixtures/`.
- **Content**:
  - Smallest viable objects/arrays accepted by the schemas.
  - Stable, readable values.
  - Add at most one harmless unknown key per fixture at a tolerant level to prove preservation.
- **Never mutate fixtures** in tests; for variants, add a second tiny fixture or construct a minimal inline payload.

---

## Maintainer notes

- If upstream adds more request params (filters, ordering), add them to the request schema and extend **requests** + **functional** tests (serialization and strictness).
- If list/detail shapes change (e.g., field renames), update the schema and the essentials checks; tolerance assertions should remain unless the shape fundamentally changes.
- For composite routes, always drop **all** path params before serialization to keep tests expressive and lint-clean.
