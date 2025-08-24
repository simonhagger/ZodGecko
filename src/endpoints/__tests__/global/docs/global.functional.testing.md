# Global – Functional Testing

**Routes (HTTP)**

- `GET /global`
- `GET /global/decentralized_finance_defi`

> Both routes are **enveloped** responses (typically `{ data: { … } }`). No query params.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/global/
├─ docs/
│  └─ global.functional.testing.md                 ← this file
├─ fixtures/
│  ├─ global.response.json                         ← /global payload
│  └─ global.defi.response.json                    ← /global/decentralized_finance_defi payload
├─ global.requests.test.ts                         ← request shape & serialization
├─ global.responses.test.ts                        ← response parsing & tolerance
├─ global.functional.test.ts                       ← /global behavior
├─ global.defi.functional.test.ts                  ← /global/decentralized_finance_defi behavior
└─ global.sanity.functional.test.ts                ← route-level sanity checks

```

- Keep fixtures **tiny** and immutable; don’t mutate fixtures in tests.
- One fixture per route (envelope shapes differ).

---

## What these routes must do

### `/global`

- **Params**: none.
- **Server defaults**: none (we do not inject any).
- **Response**: tolerant **envelope** with a `data` object containing key metrics.
  - Essentials in `data` (as modeled by our schema):
    - `active_cryptocurrencies`: `number`
    - `markets`: `number`
    - `market_cap_change_percentage_24h_usd`: `number`
    - `updated_at`: `number` (unix seconds)
    - `total_market_cap`: **record** of currency code → `number`
    - `total_volume`: **record** of currency code → `number`
    - `market_cap_percentage`: **record** of symbol → `number`
  - Unknown keys are preserved at both the envelope level and inside `data` where the schema is tolerant.

### `/global/decentralized_finance_defi`

- **Params**: none.
- **Server defaults**: none.
- **Response**: tolerant **envelope** with a `data` object of DeFi metrics.
  - Essentials in `data` commonly include (as modeled by our schema):
    - `defi_market_cap`, `eth_market_cap`, `trading_volume_24h`, `defi_dominance`: `number`
    - `defi_to_eth_ratio`: `number`
    - `top_coin_name`: `string`
    - `top_coin_defi_dominance`: `number`
  - Unknown keys preserved at the tolerant boundaries.

---

## Test intentions

### Requests (`global.requests.test.ts`)

- **No params**: `{}` parses and serializes to `{}` for both routes.
- **Strictness**: unknown keys are rejected (schemas are strict for requests).

### Functional

- **`global.functional.test.ts` ( `/global` )**
  - Serializer baseline: `{}` → `{}` (no server defaults).
  - Guardrail that future query params won’t silently appear.
- **`global.defi.functional.test.ts` ( `/global/decentralized_finance_defi` )**
  - Same baseline and guardrail as above.

### Responses (`global.responses.test.ts`)

- **/global fixture**:
  - Parses successfully; `data` object present.
  - Essentials validated (numbers present where modeled; record fields map to numbers).
  - **Tolerance**: prove one harmless unknown key is preserved at a tolerant level (envelope or `data`) using safe object guarding.
- **/global/defi fixture**:
  - Parses successfully; `data` object present.
  - Essentials validated (core DeFi metrics).
  - **Tolerance**: same unknown-preservation proof as above.

### Sanity (`global.sanity.functional.test.ts`)

- **Serializer baseline**:
  - `/global` with `{}` → `{}`.
  - `/global/decentralized_finance_defi` with `{}` → `{}`.

---

## Fixtures

- **Location**
  - `src/endpoints/__tests__/global/fixtures/global.response.json`
  - `src/endpoints/__tests__/global/fixtures/global.defi.response.json`
- **Content**
  - Smallest viable envelopes that the schemas accept:
    - A few numeric metrics.
    - `total_market_cap` / `total_volume` / `market_cap_percentage` as **small maps** (2–3 entries) for `/global`.
  - Include **one** harmless unknown key at a tolerant level to prove preservation.
- **Do not** mutate fixtures in tests. For variants, add a second tiny fixture or use a minimal inline payload.

---

## Maintainer notes

- If upstream adds request params later, introduce them in the request schemas and extend **requests + functional** tests accordingly.
- If record fields change shape (e.g., values become strings), update schemas and assertions. Keep the tolerance checks intact unless the envelope fundamentally changes.
- Preserve the envelope semantics in tests (`{ data: { … } }`): assert on `data` with safe object guards to avoid unsafe property access.
