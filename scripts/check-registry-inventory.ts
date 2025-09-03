/* eslint-disable no-console */
/**
 * Verify docs/registry-inventory.md matches src/registry/generated.ts.
 *
 * We assert, per (id, version/plan):
 * - pathTemplate
 * - requiredPath
 * - requiredQuery
 * - optional with server defaults (rendered `key=value`)
 * - optional other (from queryRules minus required & defaults)
 *
 * CLI:
 *   --debug
 *   --only=coins.by-id,coins.by-id.history
 *   --version=v3.0.1
 *   --plan=public
 *
 * Usage:
 *   pnpm tsx scripts/check-registry-inventory.ts
 */

import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const DOC_MD = path.join(ROOT, "docs", "registry-inventory.md");
const REGISTRY_GEN_TS = path.join(ROOT, "src", "registry", "generated.ts");

/* ------------ local minimal types (match generator output) ------------- */
type Version = "v3.0.1" | "v3.1.1";
type Plan = "public" | "paid";

type QueryRule = Readonly<{
  key: string;
  required?: boolean;
}>;

type RegistryEndpoint = Readonly<{
  id: string;
  validFor: Readonly<{ version: Version; plan: Plan }>;
  method: string;
  pathTemplate: string;
  requiredPath: readonly string[];
  requiredQuery?: readonly string[];
  queryRules: readonly QueryRule[];
  serverDefaults: Readonly<Record<string, unknown>>;
}>;

/* --------------------------- CLI flags --------------------------- */
type CliFlags = {
  debug: boolean;
  only?: string[];
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
        "Usage: tsx scripts/check-registry-inventory.ts [--debug] [--only=ids] [--version=vX.Y.Z] [--plan=public|paid]",
      );
      process.exit(0);
    }
  }
  return flags;
}
const FLAGS = parseArgs(process.argv);
const log = (...args: unknown[]) => {
  if (FLAGS.debug) console.log("[check:registry]", ...args);
};

/* --------------------------- helpers --------------------------- */
function parseBacktickedList(cell: string): string[] {
  if (cell.includes("*(none)*")) return [];
  return [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]).sort((a, b) => a.localeCompare(b));
}
function formatDefaultValue(v: unknown): string {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return /[`,]/.test(v) ? JSON.stringify(v) : v;
  return JSON.stringify(v);
}
function kvDefaults(d: Record<string, unknown>): string[] {
  return Object.entries(d)
    .map(([k, v]) => `${k}=${formatDefaultValue(v)}`)
    .sort((a, b) => a.localeCompare(b));
}
function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

/* --------------------- parse markdown table --------------------- */
/**
 * The generator emits rows like:
 * | `id` | `version/plan` | `METHOD` | `/path/{id}` | `p1`, `p2` | `q1`, `q2` | `k=v`, `...` | `k3`, `k4` |
 */
function parseMd(md: string): Array<{
  key: string; // id@version/plan
  id: string;
  version: Version;
  plan: Plan;
  method: string;
  pathTemplate: string;
  reqPath_doc: string[];
  reqQuery_doc: string[];
  optWithDefault_doc: string[];
  optOther_doc: string[];
}> {
  const rows = [
    ...md.matchAll(
      /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|$/gm,
    ),
  ];

  return rows.map((m) => {
    const id = m[1].trim();
    const vp = m[2].trim(); // e.g. v3.0.1/public
    const method = m[3].trim();
    const pathTemplate = m[4].trim();

    const [version, plan] = vp.split("/") as [Version, Plan];

    return {
      key: `${id}@${version}/${plan}`,
      id,
      version,
      plan,
      method,
      pathTemplate,
      reqPath_doc: parseBacktickedList(m[5]),
      reqQuery_doc: parseBacktickedList(m[6]),
      optWithDefault_doc: parseBacktickedList(m[7]),
      optOther_doc: parseBacktickedList(m[8]),
    };
  });
}

/* -------------------- load generated registry -------------------- */
async function loadRegistry(): Promise<ReadonlyArray<RegistryEndpoint>> {
  const mod = await import(pathToFileURL(REGISTRY_GEN_TS).href);
  const arr: unknown = (mod as any).GENERATED_REGISTRY ?? [];
  if (!Array.isArray(arr)) throw new Error("GENERATED_REGISTRY not found or not an array");
  return arr as ReadonlyArray<RegistryEndpoint>;
}

/* ------------------------------ diff ------------------------------ */
function diff(label: string, docs: string[], code: string[]): boolean {
  const D = new Set(docs);
  const C = new Set(code);
  const onlyDocs = docs.filter((x) => !C.has(x));
  const onlyCode = code.filter((x) => !D.has(x));
  if (onlyDocs.length || onlyCode.length) {
    console.error(`❌ ${label} mismatch`);
    if (onlyDocs.length) console.error("   Only in docs:", onlyDocs.join(", "));
    if (onlyCode.length) console.error("   Only in code:", onlyCode.join(", "));
    return false;
  }
  return true;
}

/* ------------------------------- main ------------------------------- */
async function main(): Promise<void> {
  console.log("[check:registry] Verifying docs/registry-inventory.md…");

  const md = readFileSync(DOC_MD, "utf8");
  const rows = parseMd(md);

  const entries = (await loadRegistry()).filter((e) => {
    if (FLAGS.version && e.validFor.version !== FLAGS.version) return false;
    if (FLAGS.plan && e.validFor.plan !== FLAGS.plan) return false;
    if (FLAGS.only && FLAGS.only.length > 0) {
      return FLAGS.only.some((needle) => e.id.includes(needle));
    }
    return true;
  });

  // Build code-side expectations
  const codeMap = new Map<
    string,
    {
      id: string;
      version: Version;
      plan: Plan;
      method: string;
      pathTemplate: string;
      reqPath: string[];
      reqQuery: string[];
      optWithDefault: string[];
      optOther: string[];
    }
  >();

  for (const e of entries) {
    const key = `${e.id}@${e.validFor.version}/${e.validFor.plan}`;

    const reqPath = [...(e.requiredPath ?? [])].sort((a, b) => a.localeCompare(b));
    const reqQuery = [...(e.requiredQuery ?? [])].sort((a, b) => a.localeCompare(b));

    const defaultsKV = kvDefaults(e.serverDefaults || {});
    const ruleKeys = uniq((e.queryRules || []).map((r) => r.key));
    const defaultsKeys = Object.keys(e.serverDefaults || {});
    const optOther = ruleKeys
      .filter((k) => !reqQuery.includes(k) && !defaultsKeys.includes(k))
      .sort((a, b) => a.localeCompare(b));

    codeMap.set(key, {
      id: e.id,
      version: e.validFor.version,
      plan: e.validFor.plan,
      method: e.method,
      pathTemplate: e.pathTemplate,
      reqPath,
      reqQuery,
      optWithDefault: defaultsKV,
      optOther,
    });
  }

  // Check doc rows ↔ code entries
  let ok = true;

  // 1) Missing/extra rows
  const docKeys = new Set(rows.map((r) => r.key));
  const codeKeys = new Set(codeMap.keys());

  const onlyDocs = [...docKeys].filter((k) => !codeKeys.has(k));
  const onlyCode = [...codeKeys].filter((k) => !docKeys.has(k));
  if (onlyDocs.length) {
    ok = false;
    console.error("❌ Rows present in docs but not in registry:", onlyDocs.join(", "));
  }
  if (onlyCode.length) {
    ok = false;
    console.error("❌ Rows missing in docs (present in registry):", onlyCode.join(", "));
  }

  // 2) Per-row deep checks
  for (const r of rows) {
    const c = codeMap.get(r.key);
    if (!c) continue; // already reported as onlyDocs

    if (r.method !== c.method) {
      ok = false;
      console.error(`❌ ${r.key} Method mismatch: docs=${r.method} code=${c.method}`);
    }
    if (r.pathTemplate !== c.pathTemplate) {
      ok = false;
      console.error(
        `❌ ${r.key} Path template mismatch: docs=${r.pathTemplate} code=${c.pathTemplate}`,
      );
    }

    ok &&= diff(`${r.key} Required (path)`, r.reqPath_doc, c.reqPath);
    ok &&= diff(`${r.key} Required (query)`, r.reqQuery_doc, c.reqQuery);
    ok &&= diff(`${r.key} Optional (server defaults)`, r.optWithDefault_doc, c.optWithDefault);
    ok &&= diff(`${r.key} Optional (other)`, r.optOther_doc, c.optOther);
  }

  if (!ok) {
    process.exit(1);
  }
  console.log("✅ registry-inventory.md matches generated registry");
}

main().catch((err) => {
  console.error("[check:registry] ❌ Failed");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
