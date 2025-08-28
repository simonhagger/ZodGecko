// examples/basic-usage.ts
import { toURL } from "../src/runtime/url.js";
import { formatPath } from "../src/runtime/url.js";

const base = "https://api.coingecko.com/api/v3";
const path = formatPath("/coins/{id}/tickers", { id: "bitcoin" });
const url = toURL(base, path, { page: 1 });
void url; // compile-only sanity check
