/*
 * scripts/gen-registry.ts
 * ---------------------------------------------------------------------------
 * Generates the runtime registry as a **single `as const` array** export.
 *
 * Output:
 *   - src/registry/generated.ts   (runtime, `GENERATED_REGISTRY` as const)
 *
 * Notes:
 *   - This script expects an array of `EntrySource` from your existing discovery
 *     step. Replace `loadEntries()` with your project-specific loader.
 *   - The writer consolidates schema imports and emits them once at the top of
 *     `generated.ts`.
 */

/* eslint-disable no-console */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import prettier from "prettier";

import { pathTemplateFromSlug } from "../src/registry/path-from-slug.js";
import {
  getTypeName,
  getQMeta,
  isOptionalish,
  unwrapForDefaultsDeep,
  getObjectShape,
} from "../src/helpers/introspection.js";
import { discoverSchemaModules } from "../src/helpers/discovery.js";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SCHEMAS = path.join(SRC, "schemas");
const OUT = path.join(SRC, "registry", "generated.ts");

/* ---------------- CLI flags ---------------- */
type Cli = {
  debug: boolean;
  only: Set<string> | null;
  dumpShape: boolean;
  dumpRequest: boolean;
};
function parseCli(argv: string[]): Cli {
  let debug = false;
  let only: Set<string> | null = null;
  let dumpShape = false;
  let dumpRequest = false;

  for (const a of argv.slice(2)) {
    if (a === "--debug") debug = true;
    else if (a.startsWith("--only=")) {
      const list = a
        .slice("--only=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      only = new Set(list);
    } else if (a === "--dump-shape") dumpShape = true;
    else if (a === "--dump-request") dumpRequest = true;
  }
  return { debug, only, dumpShape, dumpRequest };
}
const CLI = parseCli(process.argv);
function dbg(...args: unknown[]): void {
  if (CLI.debug) console.log("[gen-registry]", ...args);
}

/* ---------- helpers ---------- */
function requiredFromTemplate(tpl: string): string[] {
  const out = new Set<string>();
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl))) out.add(m[1]);
  return Array.from(out);
}
function sanitizeAlias(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "_");
}

// Build a wrapped import so max-len never trips (always multi-line, trailing comma)
function buildWrappedImport(alias: string, specifierFromRegistryDir: string): string {
  const lines = [
    "import {",
    `  requestSchema as req_${alias},`,
    `  responseSchema as res_${alias},`,
    `} from "${specifierFromRegistryDir}";`,
  ];
  return lines.join("\n");
}

// Normalize an import specifier string for sorting so "." sorts AFTER "/"
function normalizeSpecifierForSort(spec: string): string {
  return spec.replaceAll(".", "~");
}

/* -------------------------- request schema import helpers -------------------------- */
type RequestSource =
  | "barrel:requestSchema"
  | "barrel:baseRequestSchema"
  | "request.ts"
  | "base-request.ts"
  | "none";

async function tryImportRequest(
  file: string,
): Promise<{ schema?: unknown; source: RequestSource }> {
  // 1) barrel/index.ts
  try {
    const mod = await import(pathToFileURL(file).href);
    if ((mod as any).requestSchema)
      return { schema: (mod as any).requestSchema, source: "barrel:requestSchema" };
    if ((mod as any).baseRequestSchema)
      return { schema: (mod as any).baseRequestSchema, source: "barrel:baseRequestSchema" };
  } catch {
    /* ignore */
  }

  // 2) sibling request.ts
  try {
    const reqFile = file.replace(/index\.ts$/, "request.ts");
    const reqMod = await import(pathToFileURL(reqFile).href);
    if ((reqMod as any).requestSchema)
      return { schema: (reqMod as any).requestSchema, source: "request.ts" };
    if ((reqMod as any).baseRequestSchema)
      return { schema: (reqMod as any).baseRequestSchema, source: "request.ts" };
  } catch {
    /* ignore */
  }

  // 3) two-level base-request.ts  (../../base-request.ts)
  try {
    const baseReqFile = path.join(path.dirname(file), "..", "..", "base-request.ts");
    await fs.access(baseReqFile);
    const baseMod = await import(pathToFileURL(baseReqFile).href);
    if ((baseMod as any).baseRequestSchema) {
      return { schema: (baseMod as any).baseRequestSchema, source: "base-request.ts" };
    }
  } catch {
    /* ignore */
  }

  return { schema: undefined, source: "none" };
}

async function importModule(file: string): Promise<{
  meta: { pathTemplate?: string; method?: string } | null;
  requestSchema?: unknown;
  responseSchema?: unknown;
  requestSource: RequestSource;
}> {
  const mod = await import(pathToFileURL(file).href); // tsx resolves .js specifiers to .ts
  const { schema, source } = await tryImportRequest(file);

  const meta = (mod as any).meta ?? null;
  const responseSchema = (mod as any).responseSchema;

  return { meta, requestSchema: schema, responseSchema, requestSource: source };
}

/* ------------------------------ main ------------------------------ */
async function main(): Promise<void> {
  const mods = await discoverSchemaModules({ schemasDir: SCHEMAS, only: CLI.only });

  const importBlocks: Array<{ key: string; sortKey: string; block: string }> = [];
  const entryBlocks: string[] = [];

  for (const m of mods) {
    const { meta, requestSchema, responseSchema, requestSource } = await importModule(m.file);
    if (!responseSchema) {
      console.warn(`Skipping ${m.file}: missing responseSchema`);
      continue;
    }

    // Path: meta override or slug-derived
    let pathTemplate: string;
    let requiredPath: string[];
    if (meta?.pathTemplate) {
      pathTemplate = meta.pathTemplate;
      requiredPath = requiredFromTemplate(meta.pathTemplate);
      const derived = pathTemplateFromSlug(m.slug);
      const a = [...requiredPath].sort().join(",");
      const b = [...derived.requiredParams].sort().join(",");
      if (a !== b) {
        console.warn(
          `Param mismatch for ${m.slug}: template {${a}} vs slug-derived {${b}} — verify.`,
        );
      }
    } else {
      const derived = pathTemplateFromSlug(m.slug);
      pathTemplate = derived.template;
      requiredPath = [...derived.requiredParams];
    }

    dbg(`→ ${m.slug} [${m.version}/${m.plan}] requestSource=${requestSource}`);
    if (CLI.dumpRequest) {
      const kind = requestSchema === undefined ? "unknown" : typeof requestSchema;
      const ctor =
        requestSchema && (requestSchema as any).constructor
          ? (requestSchema as any).constructor.name
          : "(no ctor)";
      const hasDef = !!(requestSchema && (requestSchema as any)._def);
      const tname = getTypeName(requestSchema);
      dbg("   requestSchema dump:", {
        kind,
        ctor,
        hasDef,
        typeName: tname,
        keys:
          requestSchema && typeof requestSchema === "object"
            ? Object.keys(requestSchema as object)
            : [],
      });
    }

    // Cross-check path keys from request schema (when present & normalized)
    if (requestSchema) {
      const root = getObjectShape(requestSchema);
      const pathObj = root?.path ? getObjectShape((root as { path: unknown }).path) : null;
      if (pathObj) {
        const keys = Object.keys(pathObj).sort();
        const req = [...requiredPath].sort();
        if (JSON.stringify(keys) !== JSON.stringify(req)) {
          throw new Error(
            `Path keys ${JSON.stringify(keys)} do not match required ${JSON.stringify(
              req,
            )} for ${m.slug}`,
          );
        }
      }
    }

    // Derive queryRules & serverDefaults (normalized OR legacy)
    const queryRuleObjs: string[] = [];
    const serverDefaultLines: string[] = [];
    const requiredQueryNames: string[] = [];

    // Prefer normalized request.query; else legacy flat minus path keys
    let qShape: Record<string, unknown> | null = null;

    if (requestSchema) {
      const rootObj = getObjectShape(requestSchema);
      if (rootObj) {
        if ("query" in rootObj && (rootObj as { query?: unknown }).query) {
          qShape = getObjectShape((rootObj as { query: unknown }).query);
          dbg(
            `   using normalized query shape: keys=${
              qShape ? Object.keys(qShape).sort().join(",") : "(none)"
            }`,
          );
        } else {
          const flat: Record<string, unknown> = { ...rootObj };
          for (const p of requiredPath) delete flat[p];
          qShape = flat;
          dbg(`   using legacy flat shape: keys=${Object.keys(qShape).sort().join(",")}`);
        }
      } else {
        dbg("   requestSchema had no object shape");
      }
    } else {
      dbg("   no requestSchema found");
    }

    if (CLI.dumpShape && qShape) {
      console.log(
        `[shape] ${m.slug} ${m.version}/${m.plan}:`,
        Object.keys(qShape).sort().join(", "),
      );
    }

    if (qShape) {
      const entries = Object.entries(qShape);
      for (let i = 0; i < entries.length; i += 1) {
        const [key, schema] = entries[i];
        const { inner, defaultValue, wasOptional, isArray } = unwrapForDefaultsDeep(schema);
        const optionalish = wasOptional || isOptionalish(schema);
        const metaQ = getQMeta(schema) ?? getQMeta(inner) ?? {};
        const parts: string[] = [`key: "${key}"`];

        if (defaultValue !== undefined) {
          parts.push(`default: ${JSON.stringify(defaultValue)}`);
          serverDefaultLines.push(`  ${key}: ${JSON.stringify(defaultValue)}`);
        } else if (!optionalish) {
          // no default and not optional → required
          parts.push("required: true");
          requiredQueryNames.push(`"${key}"`);
        }
        if (metaQ.arrayEncoding) {
          parts.push(`arrayEncoding: "${metaQ.arrayEncoding}"`);
        } else if (isArray) {
          // optional: if you want a hint even without explicit encoding policy
          parts.push('kind: "array"');
        }
        if (metaQ.dropWhenDefault === false) {
          parts.push("dropWhenDefault: false");
        }

        // one object per line, no trailing comma inside the object
        queryRuleObjs.push(`  { ${parts.join(", ")} }`);
      }
    }

    // Imports
    const srcIndexSpecifier = path
      .relative(path.join(SRC, "registry"), m.file)
      .replace(/\\/g, "/")
      .replace(/\.ts$/, ".js");
    const alias = sanitizeAlias(`${m.slug}_${m.version}_${m.plan}`);

    const importRecord = {
      key: srcIndexSpecifier,
      sortKey: normalizeSpecifierForSort(srcIndexSpecifier),
      block: buildWrappedImport(alias, srcIndexSpecifier),
    };

    const method = (meta?.method ?? "GET").toUpperCase();

    const queryRulesBlock = "[" + queryRuleObjs.join(",") + "] as const";
    const requiredQueryBlock = "[" + requiredQueryNames.join(",") + "] as const";
    const serverDefaultsBlock = "{" + serverDefaultLines.join(",") + "} as const";

    // Push entry object (we'll wrap into an array later)
    entryBlocks.push(
      [
        `{`,
        `  id: "${m.slug}",`,
        `  validFor: { version: "${m.version}", plan: "${m.plan}" } as const,`,
        `  method: "${method}",`,
        `  pathTemplate: "${pathTemplate}",`,
        `  requiredPath: ${String(JSON.stringify(requiredPath)).replace(/,/g, ", ")} as const,`,
        `  requiredQuery: ${requiredQueryBlock},`,
        `  queryRules: ${queryRulesBlock},`,
        `  serverDefaults: ${serverDefaultsBlock},`,
        `  requestSchema: req_${alias},`,
        `  responseSchema: res_${alias},`,
        `}`,
      ].join("\n"),
    );

    importBlocks.push(importRecord);
  }

  // Build one contiguous, sorted import block
  importBlocks.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const importBlock = [...importBlocks.map((x) => x.block)].join("\n");
  // Add a single type-only import for the runtime file
  const typesImport = 'import type { RegistryEntry } from "../types.js";';

  const header = "/* AUTO-GENERATED FILE — DO NOT EDIT" + "\n" + "* Run: pnpm gen:registry */";

  // Emit a SINGLE as-const array export
  const out =
    `${header}` +
    "\n" +
    `${importBlock}` +
    `${typesImport}` +
    "\n" +
    `export const GENERATED_REGISTRY = [
` +
    `${entryBlocks.join(",")}
` +
    `] as const satisfies readonly RegistryEntry[];`;
  // ` +
  //     `export type GeneratedRegistryType = typeof GENERATED_REGISTRY;
  // `;

  // format with project config (Prettier picks parser from filepath)
  const prettierConfig = (await prettier.resolveConfig(OUT).catch(() => null)) ?? {};
  const formatted = await prettier.format(out, { ...prettierConfig, filepath: OUT });

  await fs.writeFile(OUT, formatted, "utf8");
  console.log(`Generated ${path.relative(ROOT, OUT)} with ${entryBlocks.length} entries.`);
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});
