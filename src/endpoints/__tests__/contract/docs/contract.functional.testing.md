# Contract – Functional Testing

**Routes (HTTP)**  
Grouped as “contract” in source; HTTP paths live under **`/coins/*/contract/*`**:

- `GET /coins/{id}/contract/{contract_address}` — contract detail
- `GET /coins/{id}/contract/{contract_address}/market_chart` — chart by days
- `GET /coins/{id}/contract/{contract_address}/market_chart/range` — chart by unix time range

> Path params (`{id}`, `{contract_address}`) are **not** serialized into query.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/contract/
├─ docs/
│  └─ contract.functional.testing.md                ← this file
├─ fixtures/
│  ├─ contract.detail.response.json                 ← /contract/{contract_address} payload
│  ├─ contract.market-chart.response.json           ← /contract/{contract_address}/market_chart payload
│  └─ contract.market-chart-range.response.json     ← /contract/{contract_address}/market_chart/range payload
├─ contract.requests.test.ts                        ← request shape & serialization
├─ contract.responses.test.ts                       ← response parsing & tolerance
├─ contract.detail.functional.test.ts               ← /contract/{contract_address} behavior
├─ contract.market-chart.functional.test.ts         ← /contract/{contract_address}/market_chart behavior
├─ contract.market-chart-range.functional.test.ts   ← /contract/{contract_address}/market_chart/range behavior
└─ contract.sanity.functional.test.ts               ← route-level sanity checks

```

- Keep fixtures **tiny** and immutable; don’t mutate fixtures in tests.
- One fixture per distinct response shape.

---

## What these routes must do

### `/coins/{id}/contract/{contract_address}` (detail)

- **Params**: path-only (no query).
- **Server defaults**: none serialized by us.
- **Response**: tolerant object describing the token/asset at that contract address (unknown fields preserved).

### `/coins/{id}/contract/{contract_address}/market_chart`

- **Request**:
  - `vs_currency` (required)
  - `days` (number or string) → serialized as string
  - **No `interval`** on this route (reject unknown key)
  - `precision` optional; **no library default** — only serialize if provided
- **Response**: tolerant arrays (`prices`, `market_caps`, `total_volumes`).

### `/coins/{id}/contract/{contract_address}/market_chart/range`

- **Request**:
  - `vs_currency` (required)
  - `from`, `to` are **unix seconds as numbers** → serialized as strings (reject strings)
  - `precision` optional; **no library default**
- **Response**: same tolerant arrays as `market_chart`.

---

## Test intentions

### Requests (`contract.requests.test.ts`)

- **Detail**: path-only; after dropping path params, serialized query is `{}`; schema rejects unknown keys.
- **Market chart**:
  - `days` number→string normalization; `vs_currency` required.
  - Assert **no `interval`**; invalid key rejected.
  - `precision` is kept **only if provided** (no default-dropping).
- **Range**:
  - `from`/`to` must be numeric; string timestamps rejected.
  - Numbers serialize to strings; `precision` kept only if supplied.

### Functional

- **`contract.detail.functional.test.ts`**
  - Drop `{ id, contract_address }` via helper → `{}`; guardrails against silent defaults.
- **`contract.market-chart.functional.test.ts`**
  - End-to-end parse → serialize proves: `days` normalization, `vs_currency` required, no `interval`, optional `precision` kept.
- **`contract.market-chart-range.functional.test.ts`**
  - End-to-end parse → serialize proves: numeric `from`/`to` to strings; reject string inputs; optional `precision` kept.

### Responses (`contract.responses.test.ts`)

- **Detail fixture** parses; essentials validated with small guards (e.g., `id`/`symbol`/`name` as strings when present); unknown top-level fields preserved.
- **Market chart fixture** parses; arrays present and minimally shaped; unknown envelope fields preserved.
- **Range fixture** parses similarly; unknowns preserved.

### Sanity (`contract.sanity.functional.test.ts`)

- **Serializer baseline**:
  - `/coins/{id}/contract/{contract_address}` with `{}` → `{}` (after dropping path params).
  - `/market_chart` with parsed minimal inputs → only expected keys; no `interval`.
  - `/market_chart/range` with parsed numeric `from`/`to` → only expected keys; no implicit `precision`.

---

## Fixtures

- **Location**
  - `src/endpoints/__tests__/contract/fixtures/contract.detail.response.json`
  - `src/endpoints/__tests__/contract/fixtures/contract.market-chart.response.json`
  - `src/endpoints/__tests__/contract/fixtures/contract.market-chart-range.response.json`
- **Content**
  - Smallest viable payloads that the schemas accept.
  - Stable values (small numbers, fixed timestamps).
  - Add at most one harmless unknown key at the tolerant level (row or envelope) to prove preservation.
- **Do not** mutate fixtures in tests. Add a second tiny file or use an inline payload if you need variations.

---

## Maintainer notes

- If upstream later **adds `interval`** to the contract `market_chart` route, update the request schema and adjust the functional + requests tests accordingly.
- If upstream relaxes `from`/`to` to accept strings, flip the rejection test and schema type.
- Keep to the helper convention: **`dropIdAndAddress`** for path params; avoid inline destructuring to prevent lint churn and keep intent obvious.
