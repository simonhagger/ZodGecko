/* eslint-disable no-console */
/**
 * Build docs/registry-inventory.* from the generated registry.
 *
 * Outputs:
 *  - docs/registry-inventory.md
 *  - docs/registry-inventory.json
 *
 * CLI:
 *   --debug
 *   --only=coins.by-id,coins.by-id.history   (comma-separated match on id)
 *   --version=v3.0.1                         (filter by ApiVersion)
 *   --plan=public                            (filter by ApiPlan)
 *
 * Usage:
 *   pnpm tsx scripts/generate-registry-inventory.ts --debug
 *   pnpm tsx scripts/generate-registry-inventory.ts --only=simple.price --version=v3.0.1
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ---- Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const OUT_MD = path.join(ROOT, "docs", "registry-inventory.md");
const OUT_JSON = path.join(ROOT, "docs", "registry-inventory.json");

// We read straight from the auto-generated registry to avoid drift.
const REGISTRY_GEN_TS = path.join(ROOT, "src", "registry", "generated.ts");

// ---- Local minimal types (avoid runtime imports from src/* at script time)
type Version = "v3.0.1" | "v3.1.1";
type Plan = "public" | "paid";

type QueryRule = Readonly<{
  key: string;
  required?: boolean;
  // (other metadata like arrayEncoding / dropWhenDefault can exist but are not needed here)
}>;

type RegistryEndpoint = Readonly<{
  id: string; // slug (e.g., "coins.by-id")
  validFor: Readonly<{ version: Version; plan: Plan }>;
  method: string; // "GET" | ...
  pathTemplate: string; // e.g., "/coins/{id}"
  requiredPath: readonly string[];
  requiredQuery?: readonly string[];
  queryRules: readonly QueryRule[];
  serverDefaults: Readonly<Record<string, unknown>>;
}>;

// ---- CLI flags
type CliFlags = {
  debug: boolean;
  only?: string[]; // ids
  version?: Version;
  plan?: Plan;
};

function parseArgs(argv: string[]): CliFlags {
  const flags: CliFlags = { debug: false };
  for (const a of argv.slice(2)) {
    if (a === "--debug") flags.debug = true;
    else if (a.startsWith("--only="))
      flags.only = a
        .split("=", 2)[1]
        .split(",")
        .map((s) => s.trim());
    else if (a.startsWith("--version=")) flags.version = a.split("=", 2)[1] as Version;
    else if (a.startsWith("--plan=")) flags.plan = a.split("=", 2)[1] as Plan;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: tsx scripts/generate-registry-inventory.ts [--debug] [--only=ids] [--version=vX.Y.Z] [--plan=public|paid]",
      );
      process.exit(0);
    }
  }
  return flags;
}
const FLAGS = parseArgs(process.argv);
const log = (...args: unknown[]) => {
  if (FLAGS.debug) console.log("[docs:registry]", ...args);
};

// ---- Small helpers
function backtickList(items: string[]): string {
  const arr = [...new Set(items)];
  if (arr.length) arr.sort((a, b) => a.localeCompare(b));
  return arr.length ? arr.map((k) => `\`${k}\``).join(", ") : "*(none)*";
}

function formatDefaultValue(v: unknown): string {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return /[`,]/.test(v) ? JSON.stringify(v) : v;
  return JSON.stringify(v);
}

function renderMarkdown(
  rows: Array<{
    id: string;
    version: Version;
    plan: Plan;
    method: string;
    pathTemplate: string;
    reqPath: string[];
    reqQuery: string[];
    optWithDefault: string[];
    optOther: string[];
  }>,
): string {
  const intro = `# Registry Inventory

This document lists **all CoinGecko API surfaces supported by ZodGecko**, derived from the generated
registry. For each entry, you’ll see required path/query params and any server defaults that apply.

Columns:
- **ID** — ZodGecko endpoint id (slug).
- **Version/Plan** — The specific CoinGecko API variant this entry targets.
- **Method** — HTTP method.
- **Path Template** — The REST path pattern (parameters in braces).
- **Required (path)** — URL path parameters that must be provided.
- **Required (query)** — Querystring parameters that must be provided.
- **Optional (server defaults)** — Optional query params that the server defaults when omitted (rendered as \`key=value\`).
- **Optional (other)** — Optional query params with no server-default value.

| ID | Version/Plan | Method | Path Template | Required (path) | Required (query) | Optional (server defaults) | Optional (other) |
|----|--------------|--------|---------------|------------------|------------------|----------------------------|------------------|
`;
  const body = rows
    .map((r) => {
      return `| \`${r.id}\` | \`${r.version}/${r.plan}\` | \`${r.method}\` | \`${r.pathTemplate}\` | ${backtickList(r.reqPath)} | ${backtickList(r.reqQuery)} | ${backtickList(r.optWithDefault)} | ${backtickList(r.optOther)} |`;
    })
    .join("\n");

  const tsUtc = new Date().toISOString().replace("T", " ").replace("Z", " UTC");
  const shortSha = (process.env.GITHUB_SHA || "").slice(0, 7);
  const footer = `

_Generated on ${tsUtc}${shortSha ? ` (commit ${shortSha})` : ""}._\n`;
  return intro + body + footer;
}

// ---- Load registry entries from generated.ts
async function loadRegistry(): Promise<ReadonlyArray<RegistryEndpoint>> {
  const mod = await import(pathToFileURL(REGISTRY_GEN_TS).href);
  const arr: unknown = (mod as any).GENERATED_REGISTRY ?? [];
  if (!Array.isArray(arr)) {
    throw new Error("GENERATED_REGISTRY not found or not an array");
  }
  return arr as ReadonlyArray<RegistryEndpoint>;
}

// ---- Main
async function main(): Promise<void> {
  console.log("[docs:registry] Generating registry inventory…");
  const entries = await loadRegistry();

  // Filter set
  const filtered = entries.filter((e) => {
    if (FLAGS.version && e.validFor.version !== FLAGS.version) return false;
    if (FLAGS.plan && e.validFor.plan !== FLAGS.plan) return false;
    if (FLAGS.only && FLAGS.only.length > 0) {
      return FLAGS.only.some((needle) => e.id.includes(needle));
    }
    return true;
  });

  // Sort by id, then version, then plan for stable output
  filtered.sort((a, b) => {
    if (a.id !== b.id) return a.id.localeCompare(b.id);
    if (a.validFor.version !== b.validFor.version) {
      return a.validFor.version.localeCompare(b.validFor.version);
    }
    return a.validFor.plan.localeCompare(b.validFor.plan);
  });

  const rows = filtered.map((e) => {
    const reqPath = [...(e.requiredPath ?? [])];

    const requiredQ = e.requiredQuery ? [...e.requiredQuery] : [];
    const defaultKeys = Object.keys(e.serverDefaults || {});
    const allRuleKeys = Array.from(new Set((e.queryRules || []).map((qr) => qr.key)));

    const optWithDefault = defaultKeys
      .map((k) => `${k}=${formatDefaultValue(e.serverDefaults[k])}`)
      .sort((a, b) => a.localeCompare(b));

    const optOther = allRuleKeys
      .filter((k) => !requiredQ.includes(k) && !defaultKeys.includes(k))
      .sort((a, b) => a.localeCompare(b));

    if (FLAGS.debug) {
      log(`→ ${e.id} [${e.validFor.version}/${e.validFor.plan}]`);
      log("   pathTemplate:", e.pathTemplate);
      log("   requiredPath:", reqPath);
      log("   requiredQuery:", requiredQ);
      log("   defaults:", e.serverDefaults);
      log("   optOther:", optOther);
    }

    return {
      id: e.id,
      version: e.validFor.version,
      plan: e.validFor.plan,
      method: e.method,
      pathTemplate: e.pathTemplate,
      reqPath,
      reqQuery: requiredQ,
      optWithDefault,
      optOther,
    };
  });

  await fs.mkdir(path.dirname(OUT_MD), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(rows, null, 2), "utf8");
  await fs.writeFile(OUT_MD, renderMarkdown(rows), "utf8");

  console.log(
    `✅ Wrote ${path.relative(ROOT, OUT_MD)} & ${path.relative(
      ROOT,
      OUT_JSON,
    )} (${rows.length} entries).`,
  );
}

main().catch((err) => {
  console.error("[docs:registry] ❌ Failed to generate registry-inventory.*");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
