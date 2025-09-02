# Endpoint Inventory

This document is the **catalogue of CoinGecko API endpoints supported by ZodGecko**.
It shows, for each endpoint, which parameters must be supplied and which are optional.

The columns are:

- **API Endpoint** — the REST path exactly as it appears in the CoinGecko API.
- **Required in Path** — parameters that must appear directly in the URL path (e.g. "/coins/{id}" requires "id").
- **Required in Querystring** — query parameters that must always be provided in the request (e.g. "/coins/markets" requires "vs_currency").
- **Optional in Querystring (with Server Defaults)** — query parameters that are optional because the server applies a default value if you omit them. These are shown in "key=value" form (e.g. "depth=false", "page=1").
- **Optional in Querystring (no Server Defaults defined)** — query parameters that are entirely optional and have no default; you only include them when you want to refine the response.

Together, these columns give you a quick reference to how each endpoint is shaped and how ZodGecko enforces it.  
Because this inventory is generated from the schemas and server defaults in the codebase, it is always up to date.

| API Endpoint | Required in Path | Required in Querystring | Optional in Querystring (with Server Defaults) | Optional in Querystring (no Server Defaults defined) |
|--------------|------------------|-------------------------|-----------------------------------------------|------------------------------------------------------|
| `/asset_platforms` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/coins/categories` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/coins/categories/list` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/coins/list` | *(none)* | *(none)* | `include_platform=false` | *(none)* |
| `/coins/markets` | *(none)* | `vs_currency` | `include_tokens=top`, `locale=en`, `order=market_cap_desc`, `page=1`, `per_page=100`, `price_change_percentage=24h`, `sparkline=false` | `category`, `ids`, `names`, `precision`, `symbols` |
| `/coins/{id}` | `id` | *(none)* | `community_data=true`, `developer_data=true`, `dex_pair_format=contract_address`, `localization=true`, `market_data=true`, `sparkline=false`, `tickers=true` | *(none)* |
| `/coins/{id}/contract/{contract_address}` | `contract_address`, `id` | *(none)* | *(none)* | *(none)* |
| `/coins/{id}/contract/{contract_address}/market_chart` | `contract_address`, `id` | `days`, `vs_currency` | *(none)* | *(none)* |
| `/coins/{id}/contract/{contract_address}/market_chart/range` | `contract_address`, `id` | `from`, `to`, `vs_currency` | *(none)* | *(none)* |
| `/coins/{id}/history` | `id` | `date` | `localization=true` | *(none)* |
| `/coins/{id}/market_chart` | `id` | `days`, `vs_currency` | *(none)* | `interval`, `precision` |
| `/coins/{id}/market_chart/range` | `id` | `from`, `to`, `vs_currency` | *(none)* | `precision` |
| `/coins/{id}/ohlc` | `id` | `vs_currency` | *(none)* | `days` |
| `/coins/{id}/tickers` | `id` | *(none)* | `depth=false`, `dex_pair_format=contract_address`, `include_exchange_logo=false`, `order=trust_score_desc`, `page=1` | `exchange_ids` |
| `/companies/public_treasury/{coin_id}` | `coin_id` | *(none)* | *(none)* | *(none)* |
| `/derivatives` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/derivatives/exchanges` | *(none)* | *(none)* | *(none)* | `order`, `page`, `per_page` |
| `/derivatives/exchanges/list` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/derivatives/exchanges/{id}` | `id` | *(none)* | *(none)* | *(none)* |
| `/exchanges` | *(none)* | *(none)* | *(none)* | `page`, `per_page` |
| `/exchanges/list` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/exchanges/{id}` | `id` | *(none)* | *(none)* | *(none)* |
| `/exchanges/{id}/tickers` | `id` | *(none)* | *(none)* | `coin_ids`, `depth`, `include_exchange_logo`, `order`, `page` |
| `/exchanges/{id}/volume_chart` | `id` | `days` | *(none)* | *(none)* |
| `/global` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/global/decentralized_finance_defi` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/ping` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/search` | *(none)* | `query` | *(none)* | *(none)* |
| `/search/trending` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/simple/price` | *(none)* | `vs_currencies` | `include_24hr_change=false`, `include_24hr_vol=false`, `include_last_updated_at=false`, `include_market_cap=false`, `include_tokens=top` | `ids`, `names`, `precision`, `symbols` |
| `/simple/supported_vs_currencies` | *(none)* | *(none)* | *(none)* | *(none)* |
| `/simple/token_price/{id}` | `id` | `contract_addresses`, `vs_currencies` | `include_24hr_change=false`, `include_24hr_vol=false`, `include_last_updated_at=false`, `include_market_cap=false` | `precision` |

_Generated on 2025-08-30 00:08:38.460 UTC._
