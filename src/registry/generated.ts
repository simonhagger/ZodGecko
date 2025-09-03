/* AUTO-GENERATED FILE — DO NOT EDIT
 * Run: pnpm gen:registry
 */
import {
  requestSchema as req_asset_platforms_v3_0_1_public,
  responseSchema as res_asset_platforms_v3_0_1_public,
} from "./../schemas/asset_platforms/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_v3_0_1_public,
  responseSchema as res_coins_by_id_v3_0_1_public,
} from "./../schemas/coins.by-id/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_contract_by_contract_address_v3_0_1_public,
  responseSchema as res_coins_by_id_contract_by_contract_address_v3_0_1_public,
} from "./../schemas/coins.by-id.contract.by-contract_address/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_contract_by_contract_address_market_chart_v3_0_1_public,
  responseSchema as res_coins_by_id_contract_by_contract_address_market_chart_v3_0_1_public,
} from "./../schemas/coins.by-id.contract.by-contract_address.market_chart/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_contract_by_contract_address_market_chart_range_v3_0_1_public,
  responseSchema as res_coins_by_id_contract_by_contract_address_market_chart_range_v3_0_1_public,
} from "./../schemas/coins.by-id.contract.by-contract_address.market_chart.range/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_history_v3_0_1_public,
  responseSchema as res_coins_by_id_history_v3_0_1_public,
} from "./../schemas/coins.by-id.history/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_market_chart_v3_0_1_public,
  responseSchema as res_coins_by_id_market_chart_v3_0_1_public,
} from "./../schemas/coins.by-id.market_chart/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_market_chart_range_v3_0_1_public,
  responseSchema as res_coins_by_id_market_chart_range_v3_0_1_public,
} from "./../schemas/coins.by-id.market_chart.range/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_ohlc_v3_0_1_public,
  responseSchema as res_coins_by_id_ohlc_v3_0_1_public,
} from "./../schemas/coins.by-id.ohlc/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_by_id_tickers_v3_0_1_public,
  responseSchema as res_coins_by_id_tickers_v3_0_1_public,
} from "./../schemas/coins.by-id.tickers/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_list_v3_0_1_public,
  responseSchema as res_coins_list_v3_0_1_public,
} from "./../schemas/coins.list/v3.0.1/public/index.js";
import {
  requestSchema as req_coins_markets_v3_0_1_public,
  responseSchema as res_coins_markets_v3_0_1_public,
} from "./../schemas/coins.markets/v3.0.1/public/index.js";
import {
  requestSchema as req_ping_v3_0_1_public,
  responseSchema as res_ping_v3_0_1_public,
} from "./../schemas/ping/v3.0.1/public/index.js";
import {
  requestSchema as req_simple_price_v3_0_1_public,
  responseSchema as res_simple_price_v3_0_1_public,
} from "./../schemas/simple.price/v3.0.1/public/index.js";
import {
  requestSchema as req_simple_supported_vs_currencies_v3_0_1_public,
  responseSchema as res_simple_supported_vs_currencies_v3_0_1_public,
} from "./../schemas/simple.supported_vs_currencies/v3.0.1/public/index.js";
import {
  requestSchema as req_simple_token_price_by_id_v3_0_1_public,
  responseSchema as res_simple_token_price_by_id_v3_0_1_public,
} from "./../schemas/simple.token_price.by-id/v3.0.1/public/index.js";
import {
  requestSchema as req_token_lists_by_asset_platform_id_all_json_v3_0_1_public,
  responseSchema as res_token_lists_by_asset_platform_id_all_json_v3_0_1_public,
} from "./../schemas/token_lists.by-asset_platform_id.all.json/v3.0.1/public/index.js";

export const GENERATED_REGISTRY = [
  {
    id: "asset_platforms",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/asset_platforms",
    requiredPath: [] as const,
    requiredQuery: [] as const,
    queryRules: [{ key: "filter" }] as const,
    serverDefaults: {} as const,
    requestSchema: req_asset_platforms_v3_0_1_public,
    responseSchema: res_asset_platforms_v3_0_1_public,
  },

  {
    id: "coins.by-id",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}",
    requiredPath: ["id"] as const,
    requiredQuery: [] as const,
    queryRules: [
      { key: "localization", default: true },
      { key: "tickers", default: true },
      { key: "market_data", default: true },
      { key: "community_data", default: true },
      { key: "developer_data", default: true },
      { key: "sparkline", default: false },
      { key: "dex_pair_format" },
    ] as const,
    serverDefaults: {
      localization: true,
      tickers: true,
      market_data: true,
      community_data: true,
      developer_data: true,
      sparkline: false,
    } as const,
    requestSchema: req_coins_by_id_v3_0_1_public,
    responseSchema: res_coins_by_id_v3_0_1_public,
  },

  {
    id: "coins.by-id.contract.by-contract_address",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/contract/{contract_address}",
    requiredPath: ["id", "contract_address"] as const,
    requiredQuery: [] as const,
    queryRules: [] as const,
    serverDefaults: {} as const,
    requestSchema: req_coins_by_id_contract_by_contract_address_v3_0_1_public,
    responseSchema: res_coins_by_id_contract_by_contract_address_v3_0_1_public,
  },

  {
    id: "coins.by-id.contract.by-contract_address.market_chart",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/contract/{contract_address}/market_chart",
    requiredPath: ["id", "contract_address"] as const,
    requiredQuery: ["vs_currency", "days"] as const,
    queryRules: [
      { key: "vs_currency", required: true },
      { key: "days", required: true },
    ] as const,
    serverDefaults: {} as const,
    requestSchema: req_coins_by_id_contract_by_contract_address_market_chart_v3_0_1_public,
    responseSchema: res_coins_by_id_contract_by_contract_address_market_chart_v3_0_1_public,
  },

  {
    id: "coins.by-id.contract.by-contract_address.market_chart.range",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/contract/{contract_address}/market_chart/range",
    requiredPath: ["id", "contract_address"] as const,
    requiredQuery: ["vs_currency", "from", "to"] as const,
    queryRules: [
      { key: "vs_currency", required: true },
      { key: "from", required: true },
      { key: "to", required: true },
      { key: "precision" },
    ] as const,
    serverDefaults: {} as const,
    requestSchema: req_coins_by_id_contract_by_contract_address_market_chart_range_v3_0_1_public,
    responseSchema: res_coins_by_id_contract_by_contract_address_market_chart_range_v3_0_1_public,
  },

  {
    id: "coins.by-id.history",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/history",
    requiredPath: ["id"] as const,
    requiredQuery: ["contract_address", "vs_currency", "from", "to"] as const,
    queryRules: [
      { key: "contract_address", required: true },
      { key: "vs_currency", required: true },
      { key: "from", required: true },
      { key: "to", required: true },
      { key: "precision" },
    ] as const,
    serverDefaults: {} as const,
    requestSchema: req_coins_by_id_history_v3_0_1_public,
    responseSchema: res_coins_by_id_history_v3_0_1_public,
  },

  {
    id: "coins.by-id.market_chart",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/market_chart",
    requiredPath: ["id"] as const,
    requiredQuery: ["vs_currency", "days"] as const,
    queryRules: [
      { key: "vs_currency", required: true },
      { key: "days", required: true },
      { key: "interval" },
      { key: "precision" },
    ] as const,
    serverDefaults: {} as const,
    requestSchema: req_coins_by_id_market_chart_v3_0_1_public,
    responseSchema: res_coins_by_id_market_chart_v3_0_1_public,
  },

  {
    id: "coins.by-id.market_chart.range",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/market_chart/range",
    requiredPath: ["id"] as const,
    requiredQuery: ["vs_currency", "from", "to"] as const,
    queryRules: [
      { key: "vs_currency", required: true },
      { key: "from", required: true },
      { key: "to", required: true },
      { key: "precision" },
    ] as const,
    serverDefaults: {} as const,
    requestSchema: req_coins_by_id_market_chart_range_v3_0_1_public,
    responseSchema: res_coins_by_id_market_chart_range_v3_0_1_public,
  },

  {
    id: "coins.by-id.ohlc",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/ohlc",
    requiredPath: ["id"] as const,
    requiredQuery: ["vs_currency", "days"] as const,
    queryRules: [
      { key: "vs_currency", required: true },
      { key: "days", required: true },
      { key: "precision" },
    ] as const,
    serverDefaults: {} as const,
    requestSchema: req_coins_by_id_ohlc_v3_0_1_public,
    responseSchema: res_coins_by_id_ohlc_v3_0_1_public,
  },

  {
    id: "coins.by-id.tickers",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/{id}/tickers",
    requiredPath: ["id"] as const,
    requiredQuery: [] as const,
    queryRules: [
      { key: "exchange_ids" },
      { key: "include_exchange_logo", default: false },
      { key: "page" },
      { key: "order", default: "trust_score_desc" },
      { key: "depth", default: false },
      { key: "dex_pair_format", default: "contract_address" },
    ] as const,
    serverDefaults: {
      include_exchange_logo: false,
      order: "trust_score_desc",
      depth: false,
      dex_pair_format: "contract_address",
    } as const,
    requestSchema: req_coins_by_id_tickers_v3_0_1_public,
    responseSchema: res_coins_by_id_tickers_v3_0_1_public,
  },

  {
    id: "coins.list",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/list",
    requiredPath: [] as const,
    requiredQuery: [] as const,
    queryRules: [{ key: "include_platform", default: false }] as const,
    serverDefaults: { include_platform: false } as const,
    requestSchema: req_coins_list_v3_0_1_public,
    responseSchema: res_coins_list_v3_0_1_public,
  },

  {
    id: "coins.markets",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/coins/markets",
    requiredPath: [] as const,
    requiredQuery: ["vs_currency"] as const,
    queryRules: [
      { key: "vs_currency", required: true },
      { key: "ids" },
      { key: "names" },
      { key: "symbols" },
      { key: "include_tokens", default: "top" },
      { key: "category" },
      { key: "order", default: "market_cap_desc" },
      { key: "per_page", default: 100 },
      { key: "page", default: 1 },
      { key: "sparkline", default: false },
      { key: "price_change_percentage" },
      { key: "locale", default: "en" },
      { key: "precision" },
    ] as const,
    serverDefaults: {
      include_tokens: "top",
      order: "market_cap_desc",
      per_page: 100,
      page: 1,
      sparkline: false,
      locale: "en",
    } as const,
    requestSchema: req_coins_markets_v3_0_1_public,
    responseSchema: res_coins_markets_v3_0_1_public,
  },

  {
    id: "ping",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/ping",
    requiredPath: [] as const,
    requiredQuery: [] as const,
    queryRules: [] as const,
    serverDefaults: {} as const,
    requestSchema: req_ping_v3_0_1_public,
    responseSchema: res_ping_v3_0_1_public,
  },

  {
    id: "simple.price",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/simple/price",
    requiredPath: [] as const,
    requiredQuery: ["vs_currencies"] as const,
    queryRules: [
      { key: "vs_currencies", required: true },
      { key: "ids" },
      { key: "names" },
      { key: "symbols" },
      { key: "include_tokens", default: "top" },
      { key: "include_market_cap", default: false },
      { key: "include_24hr_vol", default: false },
      { key: "include_24hr_change", default: false },
      { key: "include_last_updated_at", default: false },
      { key: "precision" },
    ] as const,
    serverDefaults: {
      include_tokens: "top",
      include_market_cap: false,
      include_24hr_vol: false,
      include_24hr_change: false,
      include_last_updated_at: false,
    } as const,
    requestSchema: req_simple_price_v3_0_1_public,
    responseSchema: res_simple_price_v3_0_1_public,
  },

  {
    id: "simple.supported_vs_currencies",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/simple/supported_vs_currencies",
    requiredPath: [] as const,
    requiredQuery: [] as const,
    queryRules: [] as const,
    serverDefaults: {} as const,
    requestSchema: req_simple_supported_vs_currencies_v3_0_1_public,
    responseSchema: res_simple_supported_vs_currencies_v3_0_1_public,
  },

  {
    id: "simple.token_price.by-id",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "/simple/token_price/{id}",
    requiredPath: ["id"] as const,
    requiredQuery: ["contract_addresses", "vs_currencies"] as const,
    queryRules: [
      { key: "contract_addresses", required: true },
      { key: "vs_currencies", required: true },
      { key: "include_market_cap", default: false },
      { key: "include_24hr_vol", default: false },
      { key: "include_24hr_change", default: false },
      { key: "include_last_updated_at", default: false },
      { key: "precision" },
    ] as const,
    serverDefaults: {
      include_market_cap: false,
      include_24hr_vol: false,
      include_24hr_change: false,
      include_last_updated_at: false,
    } as const,
    requestSchema: req_simple_token_price_by_id_v3_0_1_public,
    responseSchema: res_simple_token_price_by_id_v3_0_1_public,
  },

  {
    id: "token_lists.by-asset_platform_id.all.json",
    validFor: { version: "v3.0.1", plan: "public" } as const,
    method: "GET",
    pathTemplate: "token_lists/{asset_platform_id}/all.json",
    requiredPath: ["asset_platform_id"] as const,
    requiredQuery: ["id"] as const,
    queryRules: [{ key: "id", required: true }] as const,
    serverDefaults: {} as const,
    requestSchema: req_token_lists_by_asset_platform_id_all_json_v3_0_1_public,
    responseSchema: res_token_lists_by_asset_platform_id_all_json_v3_0_1_public,
  },
] as const;
