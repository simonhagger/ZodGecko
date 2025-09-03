# Registry Inventory

This document lists **all CoinGecko API surfaces supported by ZodGecko**, derived from the generated
registry. For each entry, you’ll see required path/query params and any server defaults that apply.

Columns:
- **ID** — ZodGecko endpoint id (slug).
- **Version/Plan** — The specific CoinGecko API variant this entry targets.
- **Method** — HTTP method.
- **Path Template** — The REST path pattern (parameters in braces).
- **Required (path)** — URL path parameters that must be provided.
- **Required (query)** — Querystring parameters that must be provided.
- **Optional (server defaults)** — Optional query params that the server defaults when omitted (rendered as `key=value`).
- **Optional (other)** — Optional query params with no server-default value.

| ID | Version/Plan | Method | Path Template | Required (path) | Required (query) | Optional (server defaults) | Optional (other) |
|----|--------------|--------|---------------|------------------|------------------|----------------------------|------------------|
| `asset_platforms` | `v3.0.1/public` | `GET` | `/asset_platforms` | *(none)* | *(none)* | *(none)* | `filter` |
| `coins.by-id` | `v3.0.1/public` | `GET` | `/coins/{id}` | `id` | *(none)* | `community_data=true`, `developer_data=true`, `localization=true`, `market_data=true`, `sparkline=false`, `tickers=true` | `dex_pair_format` |
| `coins.by-id.contract.by-contract_address` | `v3.0.1/public` | `GET` | `/coins/{id}/contract/{contract_address}` | `contract_address`, `id` | *(none)* | *(none)* | *(none)* |
| `coins.by-id.contract.by-contract_address.market_chart` | `v3.0.1/public` | `GET` | `/coins/{id}/contract/{contract_address}/market_chart` | `contract_address`, `id` | `days`, `vs_currency` | *(none)* | *(none)* |
| `coins.by-id.contract.by-contract_address.market_chart.range` | `v3.0.1/public` | `GET` | `/coins/{id}/contract/{contract_address}/market_chart/range` | `contract_address`, `id` | `from`, `to`, `vs_currency` | *(none)* | `precision` |
| `coins.by-id.history` | `v3.0.1/public` | `GET` | `/coins/{id}/history` | `id` | `contract_address`, `from`, `to`, `vs_currency` | *(none)* | `precision` |
| `coins.by-id.market_chart` | `v3.0.1/public` | `GET` | `/coins/{id}/market_chart` | `id` | `days`, `vs_currency` | *(none)* | `interval`, `precision` |
| `coins.by-id.market_chart.range` | `v3.0.1/public` | `GET` | `/coins/{id}/market_chart/range` | `id` | `from`, `to`, `vs_currency` | *(none)* | `precision` |
| `coins.by-id.ohlc` | `v3.0.1/public` | `GET` | `/coins/{id}/ohlc` | `id` | `days`, `vs_currency` | *(none)* | `precision` |
| `coins.by-id.tickers` | `v3.0.1/public` | `GET` | `/coins/{id}/tickers` | `id` | *(none)* | `depth=false`, `dex_pair_format=contract_address`, `include_exchange_logo=false`, `order=trust_score_desc` | `exchange_ids`, `page` |
| `coins.list` | `v3.0.1/public` | `GET` | `/coins/list` | *(none)* | *(none)* | `include_platform=false` | *(none)* |
| `coins.markets` | `v3.0.1/public` | `GET` | `/coins/markets` | *(none)* | `vs_currency` | `include_tokens=top`, `locale=en`, `order=market_cap_desc`, `page=1`, `per_page=100`, `sparkline=false` | `category`, `ids`, `names`, `precision`, `price_change_percentage`, `symbols` |
| `ping` | `v3.0.1/public` | `GET` | `/ping` | *(none)* | *(none)* | *(none)* | *(none)* |
| `simple.price` | `v3.0.1/public` | `GET` | `/simple/price` | *(none)* | `vs_currencies` | `include_24hr_change=false`, `include_24hr_vol=false`, `include_last_updated_at=false`, `include_market_cap=false`, `include_tokens=top` | `ids`, `names`, `precision`, `symbols` |
| `simple.supported_vs_currencies` | `v3.0.1/public` | `GET` | `/simple/supported_vs_currencies` | *(none)* | *(none)* | *(none)* | *(none)* |
| `simple.token_price.by-id` | `v3.0.1/public` | `GET` | `/simple/token_price/{id}` | `id` | `contract_addresses`, `vs_currencies` | `include_24hr_change=false`, `include_24hr_vol=false`, `include_last_updated_at=false`, `include_market_cap=false` | `precision` |
| `token_lists.by-asset_platform_id.all.json` | `v3.0.1/public` | `GET` | `token_lists/{asset_platform_id}/all.json` | `asset_platform_id` | `id` | *(none)* | *(none)* |

_Generated on 2025-09-02 17:14:49.526 UTC._
