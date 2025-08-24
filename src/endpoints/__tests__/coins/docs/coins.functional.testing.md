# Coins – Functional Testing

**Routes (HTTP)**

- `GET /coins/markets`
- `GET /coins/list`
- `GET /coins/{id}`
- `GET /coins/{id}/tickers`
- `GET /coins/{id}/history`
- `GET /coins/{id}/market_chart`
- `GET /coins/{id}/market_chart/range`
- `GET /coins/{id}/ohlc`

> Some “coins” routes carry path params (`{id}`); per our conventions, path params are **not** serialized into the query.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/coins/
├─ docs/
│  └─ coins.functional.testing.md                 ← this file
├─ fixtures/
│  ├─ coins.markets.response.json                 ← markets payload
│  ├─ coins.detail.response.json                  ← /coins/{id}
│  ├─ coins.tickers.response.json                 ← /coins/{id}/tickers
│  ├─ coins.market-chart.response.json            ← /coins/{id}/market_chart
│  ├─ coins.market-chart-range.response.json      ← /coins/{id}/market_chart/range
│  └─ coins.ohlc.response.json                    ← /coins/{id}/ohlc
├─ coins.requests.test.ts                         ← request shape & serialization
├─ coins.responses.test.ts                        ← response parsing & tolerance
├─ coins.markets.functional.test.ts               ← /coins/markets behavior
├─ coins.list.functional.test.ts                  ← /coins/list behavior
├─ coins.detail.functional.test.ts                ← /coins/{id} behavior
├─ coins.tickers.functional.test.ts               ← /coins/{id}/tickers behavior
├─ coins.history.functional.test.ts               ← /coins/{id}/history behavior
├─ coins.market-chart.functional.test.ts          ← /coins/{id}/market_chart behavior
├─ coins.market-chart-range.functional.test.ts    ← /coins/{id}/market_chart/range behavior
├─ coins.ohlc.functional.test.ts                  ← /coins/{id}/ohlc behavior
└─ coins.sanity.functional.test.ts                ← route-level sanity checks

```

- Keep fixtures **small** and immutable; don’t mutate fixtures in tests.
- Each route with a distinct response shape has its own fixture; reuse only when shapes are truly identical.

---

## What these routes must do

### `/coins/markets`

- **Required param**: `vs_currency`.
- **CSV normalization**: `ids`, `names`, `symbols`, `category`, `price_change_percentage`.
- **Defaults handling**: caller-provided values equal to documented server defaults are **dropped** (e.g., `per_page=100`, `page=1`, `order=market_cap_desc`, `locale=en`, `sparkline=false`, `include_tokens="top"`). Non-defaults are kept.
- **Response**: tolerant array of market rows.

### `/coins/list`

- **Param**: `include_platform?: boolean` — only **kept when true**.
- **Response**: tolerant array of minimal coin descriptors.

### `/coins/{id}` (detail)

- **Defaults handling**: booleans with documented defaults are dropped when equal (e.g., `localization=true`, `tickers=true`, `market_data=true`, `community_data=true`, `developer_data=true`, `sparkline=false`). Flip from default → **keep**.
- **Optional**: `dex_pair_format` kept if provided.
- **Response**: tolerant detailed object.

### `/coins/{id}/tickers`

- **CSV normalization**: `exchange_ids`.
- **Defaults handling**: `order=trust_score_desc` dropped if provided; `page=1` dropped; any non-defaults (e.g., `page=2`, `include_exchange_logo=true`) are kept.
- **Response**: tolerant tickers array; small `market` blocks.

### `/coins/{id}/history`

- **Request**: `date` in `dd-mm-yyyy`; optional `localization` toggle.
- **Response**: tolerant historical snapshot.

### `/coins/{id}/market_chart`

- **Request**: `days` (number or string); optional `interval="daily"`.
- **Precision**: **no library-side default**—only serialize if caller provides it.
- **Response**: tolerant arrays (`prices`, `market_caps`, `total_volumes`).

### `/coins/{id}/market_chart/range`

- **Request**: `from`, `to` are **unix seconds as numbers** (reject string timestamps).
- **Precision**: no library default—only serialize if provided.
- **Response**: same arrays as `market_chart` (tolerant).

### `/coins/{id}/ohlc`

- **Request**: `days` enum only.
- **Response**: array of tuples `[timestamp, open, high, low, close]` (tolerant to extra envelope fields where applicable).

---

## Test intentions

### Requests (`coins.requests.test.ts`)

- **Happy path & strictness** across representative routes:
  - `markets`: requires `vs_currency`; invalid enums rejected; CSV normalization proven; default-dropping verified.
  - `list`: `include_platform: true` kept; `false` dropped.
  - `detail`: booleans equal to defaults dropped; flips kept.
  - `tickers`: `exchange_ids` normalized; `order` default dropped; `page` behavior verified.
  - `market_chart`: `days` number→string normalization, `interval` kept; **no default** imposed for `precision`.
  - `range`: numeric `from`/`to` serialized to strings; string timestamps rejected.

### Functional (per-route files)

- Assert end-to-end **parse → buildQuery** behavior that matters to consumers:
  - **Defaults**: when supplied equal to server defaults, they drop (detail, markets, tickers).
  - **Non-defaults**: kept (e.g., `page=2`, `sparkline=true`, `include_tokens="all"`, `include_exchange_logo=true`).
  - **CSV**: dedupe + sort (stable) for all array-ish inputs.
  - **Path params**: dropped before serialization via helpers (e.g., `dropId`).
  - **Type discipline**: `range` rejects string `from`/`to`.

### Responses (`coins.responses.test.ts`)

- Each fixture parses; essentials on first element/object validated via tiny guards (no unsafe access).
- **Tolerance**: an extra harmless unknown at the correct tolerance level is preserved (proven with `hasOwnProperty` after guarding).

### Sanity (`coins.sanity.functional.test.ts`)

- **Serializer baseline** for no-param routes and for param routes _without_ schema defaults (e.g., `/coins/list` with `{}` → `{}`).
- **Endpoint contract** (where schema defaults are modeled): parse `{}` then serialize to confirm nothing is unexpectedly added/removed if such defaults exist. Otherwise, prefer the baseline.

---

## Fixtures

- **Location**: per file map above under `fixtures/`.
- **Content**:
  - Smallest viable objects/arrays to prove schema acceptance.
  - Stable numeric values and timestamps.
  - At most one additional unknown field per fixture to prove tolerance.
- **Never mutate fixtures** in tests. For variants, add a second minimal fixture or construct a tiny inline payload.

---

## Maintainer notes

- If upstream updates **server defaults** (e.g., changes the default `order`), adjust the schema/default-dropping map and the affected functional tests. The sanity test should guide you to inconsistencies.
- If upstream changes **types** (e.g., `range` starts accepting string timestamps), update schemas and flip rejection tests accordingly.
- Keep **CSV normalization** and **boolean/number stringification** consistent—add a single property-based smoke test later if desired, but the current route-level assertions are sufficient for practicality.
