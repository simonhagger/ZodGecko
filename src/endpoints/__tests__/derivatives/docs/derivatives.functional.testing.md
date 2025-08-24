# Derivatives – Functional Testing

**Routes (HTTP)**

- `GET /derivatives`
- `GET /derivatives/exchanges`
- `GET /derivatives/exchanges/list`
- `GET /derivatives/exchanges/{id}`

> Path params (`{id}`) are **not** serialized into the query.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/derivatives/
├─ docs/
│  └─ derivatives.functional.testing.md             ← this file
├─ fixtures/
│  ├─ derivatives.response.json                     ← /derivatives payload
│  ├─ derivatives.exchanges.response.json           ← /derivatives/exchanges payload
│  ├─ derivatives.exchanges.list.response.json      ← /derivatives/exchanges/list payload
│  └─ derivatives.exchange-by-id.response.json      ← /derivatives/exchanges/{id} payload
├─ derivatives.requests.test.ts                     ← request shape & serialization
├─ derivatives.responses.test.ts                    ← response parsing & tolerance
├─ derivatives.exchanges.functional.test.ts         ← /derivatives/exchanges behavior
└─ derivatives.sanity.functional.test.ts            ← route-level sanity checks

```

- Keep fixtures **tiny** and immutable; don’t mutate fixtures in tests.
- One fixture per distinct response shape.

---

## What these routes must do

### `/derivatives`

- **Params**: none.
- **Server defaults**: none.
- **Response**: tolerant array of derivative rows (unknown fields preserved).

### `/derivatives/exchanges`

- **Params**:
  - `order` (enum, e.g. `name_asc`)
  - `per_page` (number)
  - `page` (number)
- **Serialization**: numbers → strings. No schema-injected defaults; only serialize what callers provide.
- **Response**: tolerant array of exchange rows.

### `/derivatives/exchanges/list`

- **Params**: none.
- **Server defaults**: none.
- **Response**: tolerant array of minimal exchange rows (`id`/`name`), unknowns preserved.

### `/derivatives/exchanges/{id}`

- **Params**: path-only (`{id}`); **no query**.
- **Server defaults**: none.
- **Response**: tolerant object/row for the exchange id, unknowns preserved.

---

## Test intentions

### Requests (`derivatives.requests.test.ts`)

- **Strictness**: unknown keys are rejected on routes that accept params.
- **Serialization**: for `/exchanges`, `per_page` & `page` normalize to strings; valid `order` accepted; invalid enum rejected.
- **No implicit defaults**: empty objects stay empty (we don’t inject pagination/order).

### Functional

- **`derivatives.exchanges.functional.test.ts`**
  - With `{ order, per_page, page }`, verify serialized query uses enum verbatim and numbers as strings.
  - With `{}`, serialized query is `{}` (no defaults).
- **Sanity (`derivatives.sanity.functional.test.ts`)**
  - `/derivatives` with `{}` → `{}`.
  - `/derivatives/exchanges/list` with `{}` → `{}`.
  - `/derivatives/exchanges/{id}`: drop path param before serialization → `{}`.

### Responses (`derivatives.responses.test.ts`)

- **/derivatives fixture** parses to a non-empty array; essentials on first row validate; unknown row fields are preserved.
- **/derivatives/exchanges fixture** parses to a non-empty array; essentials validate; unknown row fields preserved.
- **/derivatives/exchanges/list fixture** parses; essentials validate on minimal rows; unknown row fields preserved.
- **/derivatives/exchanges/{id} fixture** parses; essentials validate; unknown preserved (checked safely).

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

- If upstream adds query params (e.g., filters), introduce them in the request schema and extend **requests** + **functional** tests to assert serialization and behavior.
- If upstream changes permissible values for `order`, update the enum and the rejection test.
- Keep the **sanity** file minimal—its job is to catch unintended defaults or accidental query changes across releases.
