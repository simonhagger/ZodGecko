# Companies – Functional Testing

**Routes (HTTP)**  
(Under the companies group; HTTP paths live under `/companies/*`)

- `GET /companies/public_treasury/bitcoin`
- `GET /companies/public_treasury/ethereum`
  > These routes are path-param only (no query params). Per conventions, path params are **not** serialized.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/companies/
├─ docs/
│  └─ companies.functional.testing.md             ← this file
├─ fixtures/
│  ├─ companies.public-treasury.bitcoin.json      ← BTC treasury payload
│  └─ companies.public-treasury.ethereum.json     ← ETH treasury payload
├─ companies.requests.test.ts                     ← request shape (path-only) & serialization
├─ companies.responses.test.ts                    ← response parsing & tolerance
├─ companies.bitcoin.functional.test.ts           ← /companies/public_treasury/bitcoin behavior
├─ companies.ethereum.functional.test.ts          ← /companies/public_treasury/ethereum behavior
└─ companies.sanity.functional.test.ts            ← route-level sanity checks

```

- Keep fixtures **tiny** and immutable; don’t mutate fixtures in tests.
- Separate fixtures per coin to keep shapes obvious and diff-friendly.

---

## What these routes must do

- **No query params.** Path-only routes → serialized query is `{}` after dropping path params.
- **No server defaults.** We don’t inject defaults; `{}` stays `{}` via `buildQuery`.
- **Tolerant responses.** Arrays of rows (and/or an envelope) parse even if the API adds fields.
  - Essentials commonly validated in rows:
    - `name`: `string` (company name)
    - `symbol`: `string` (ticker), optional in some records depending on data source
    - `country`: `string | null | undefined`
    - **aggregate fields** may appear at top-level or per-coin grouping in the payload:
      - `total_entry_value_usd`: `number`
      - `total_current_value_usd`: `number`
      - `percentage_of_supply`: `number`
    - Unknown fields on rows are preserved.

---

## Test intentions

### Requests (`companies.requests.test.ts`)

- **Path-param only**: requests validate with just `{ id }` (or coin discriminator) and **drop** path param before serialization.
- **Serializer baseline**: with no query inputs, `buildQuery(PATH, {})` → `{}`.

### Functional

- **`companies.bitcoin.functional.test.ts`**
  - Drop path param → serialized query `{}`.
  - Guardrails that future query params don’t silently appear.
- **`companies.ethereum.functional.test.ts`**
  - Same as BTC: drop path param → `{}`.

### Responses (`companies.responses.test.ts`)

- **BTC fixture** parses to an array/envelope; first row validates essentials (see above).
- **ETH fixture** parses similarly; essentials validated.
- **Tolerance**: prove an extra harmless unknown key at the row level is preserved (guard with `isObjectRecord` + `hasOwnProperty`).

### Sanity (`companies.sanity.functional.test.ts`)

- **Serializer baseline** for both routes:
  - `/companies/public_treasury/bitcoin` with `{}` → `{}`.
  - `/companies/public_treasury/ethereum` with `{}` → `{}`.

---

## Fixtures

- **Location**
  - `src/endpoints/__tests__/companies/fixtures/companies.public-treasury.bitcoin.json`
  - `src/endpoints/__tests__/companies/fixtures/companies.public-treasury.ethereum.json`
- **Content**
  - Smallest viable arrays/objects that the schema accepts.
  - Stable numeric values; include at most one unknown field on a single row to prove tolerance.
- **Do not** mutate fixtures in tests. For variants, add a second tiny fixture or use an inline payload.

---

## Maintainer notes

- If upstream adds query params (e.g., pagination, filters), introduce them in the request schema, extend the **requests** test to assert serialization, and add/adjust **sanity** as needed.
- If aggregate fields move (e.g., from rows to envelope or vice versa), update the schema and the “essentials” checks in the responses test.
- Keep to the path-param helper convention (`dropId`) in functional/request tests to avoid lint churn and keep intent clear.
