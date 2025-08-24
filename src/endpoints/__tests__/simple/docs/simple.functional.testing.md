# Simple – Functional Testing

**Routes (HTTP)**

- `GET /simple/price`
- `GET /simple/token_price/{id}`

> Path params: only the token-price route has `{id}` (platform, e.g. `ethereum`). Query params are otherwise identical in spirit.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/simple/
├─ docs/
│  └─ simple.functional.testing.md                  ← this file
├─ fixtures/
│  ├─ simple.price.response.json                    ← /simple/price payload
│  └─ simple.token-price.response.json              ← /simple/token_price/{id} payload
├─ simple.requests.test.ts                          ← request shape & serialization
├─ simple.responses.test.ts                         ← response parsing & tolerance
├─ simple.price.functional.test.ts                  ← /simple/price behavior
├─ simple.token-price.functional.test.ts            ← /simple/token_price/{id} behavior
└─ simple.sanity.functional.test.ts                 ← route-level sanity checks

```

- Keep fixtures **small** and immutable; don’t mutate fixtures in tests.
- One fixture per route because the keying differs (coin id vs contract address).

---

## What these routes must do

### `/simple/price`

- **Required**: `ids` (CSV) and `vs_currencies` (CSV).
- **Optional flags**: `include_market_cap`, `include_24hr_vol`, `include_24hr_change`, `include_last_updated_at` (booleans).
- **`precision`**: optional; **no library-side default** — only serialize if provided.
- **Serialization rules**:
  - Arrays dedupe + sort → CSV.
  - Booleans → `"true" | "false"`; values equal to the **server default** (typically `false`) are dropped from the query.
  - Numbers → strings.
- **Response**: tolerant **record** keyed by coin id → `{ [currency: string]: number }`.
  - Unknown fields can be preserved at tolerant levels (e.g., wrapper), but **currency values must remain numbers**.

### `/simple/token_price/{id}`

- **Path param**: `{id}` is the platform (e.g., `ethereum`) — **not** serialized into the query.
- **Required**: `contract_addresses` (CSV), `vs_currencies` (CSV).
- **Optional flags**: same as `/simple/price` (booleans).
- **`precision`**: optional; **no library-side default**.
- **Serialization rules**: same as above (arrays → CSV; booleans stringified and default-equal values dropped; numbers → strings).
- **Response**: tolerant **record** keyed by contract address → `{ [currency: string]: number }`.
  - Unknown wrapper-level fields may be preserved; currency values remain numbers.

---

## Test intentions

### Requests (`simple.requests.test.ts`)

- `/simple/price`
  - Requires `ids` and `vs_currencies`.
  - Prove CSV normalization (dedupe + sort).
  - Booleans: `true` values kept as `"true"`; `false` values (equal to default) **dropped**.
  - `precision`: only serialized if explicitly provided (e.g., `"2"`).
- `/simple/token_price/{id}`
  - Drop `{id}` before serialization (helper).
  - Same CSV/boolean/precision behavior as `/simple/price`.

### Functional

- **`simple.price.functional.test.ts`**
  - End-to-end parse → serialize shows: arrays normalized; `true` flags present; `false` flags dropped; optional `precision` kept when provided.
- **`simple.token-price.functional.test.ts`**
  - End-to-end parse → serialize shows: path param dropped; arrays normalized; `true` flags present; `false` flags dropped; optional `precision` kept.

### Responses (`simple.responses.test.ts`)

- `/simple/price` fixture parses to a record of coin → record of currency → number.
  - Validate a couple of numeric currency values.
  - **Tolerance**: include one harmless unknown at a tolerant level (e.g., wrapper) — avoid placing unknowns where numbers are required.
- `/simple/token_price/{id}` fixture parses similarly (keyed by contract address); validate numeric currency values and tolerance as above.

### Sanity (`simple.sanity.functional.test.ts`)

- **Serializer baseline**
  - `/simple/price` with minimal valid inputs serializes **only** the expected keys.
  - `/simple/token_price/{id}` after dropping the path param serializes **only** the expected keys.
- Ensures no hidden defaults or stray params creep in.

---

## Fixtures

- **Location**
  - `src/endpoints/__tests__/simple/fixtures/simple.price.response.json`
  - `src/endpoints/__tests__/simple/fixtures/simple.token-price.response.json`
- **Content**
  - Minimal records with 1–2 coins/addresses and 1–2 currencies each.
  - Stable numeric values.
  - At most one unknown key at a tolerant boundary (not inside the currency-number maps).
- **Do not** mutate fixtures in tests. For variants, add a second tiny fixture or construct a minimal inline payload.

---

## Maintainer notes

- If upstream later accepts additional inputs (e.g., new flags), add them to the request schema, extend **requests + functional** tests, and update this doc’s “What these routes must do”.
- If upstream changes value types (e.g., currency values become strings), update the schemas and assertions accordingly. Keep tolerance assertions unless the shape becomes strictly defined without extras.
- Prefer the path-param helper (`dropId`) in token-price tests to keep intent obvious and lint rules happy.
