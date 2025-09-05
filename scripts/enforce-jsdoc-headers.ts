// scripts/enforce-jsdoc-headers.ts
import { Project } from "ts-morph";
import * as path from "node:path";
import * as fs from "node:fs";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const SCHEMAS_DIR = path.join(SRC_DIR, "schemas");
const WRITE = process.argv.includes("--write");

// Adjust if you want to include tests
const EXCLUDE_TESTS = true;

const IGNORE = new Set<string>([path.join(SRC_DIR, "registry", "generated.ts")]);

function rel(p: string) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}
function isUnder(dir: string, file: string) {
  const relPath = path.relative(dir, file);
  return !!relPath && !relPath.startsWith("..") && !path.isAbsolute(relPath);
}
function isSchemaFile(abs: string) {
  return isUnder(SCHEMAS_DIR, abs);
}
function isIgnored(abs: string) {
  if (IGNORE.has(abs)) return true;
  if (EXCLUDE_TESTS) {
    const r = rel(abs);
    if (/\b(__tests__|__fixtures__|__mocks__)\b/.test(r)) return true;
    if (/(\.spec|\.test)\.ts$/.test(r)) return true;
  }
  return false;
}

function moduleFromFile(relFile: string) {
  const noExt = relFile.replace(/\.(d\.)?ts$/, "");
  return noExt.startsWith("src/") ? noExt.slice("src/".length) : noExt;
}

function defaultSummary(relFile: string) {
  const base = path.basename(relFile).replace(/\.(d\.)?ts$/, "");
  const words = base.split(/[-_.]/g).filter(Boolean);
  const pretty = words.length ? words.join(" ").replace(/\b\w/g, (m) => m.toUpperCase()) : base;
  return `${pretty}.`;
}

function buildHeader(relFile: string) {
  const mod = moduleFromFile(relFile);
  const summary = defaultSummary(relFile);
  return `/**
 * @file ${relFile}
 * @module ${mod}
 * @summary ${summary}
 */
`;
}

/**
 * Extract the very first block comment if it starts at file top (after BOM/whitespace).
 */
function getTopBlockComment(text: string): { block: string; start: number; end: number } | null {
  const bomTrimmed = text.startsWith("\ufeff") ? text.slice(1) : text;
  const leadingWS = bomTrimmed.match(/^\s*/)?.[0].length ?? 0;
  const start = (text.startsWith("\ufeff") ? 1 : 0) + leadingWS;
  if (!text.slice(start).startsWith("/**")) return null;

  const close = text.indexOf("*/", start + 3);
  if (close === -1) return null;

  const block = text.slice(start, close + 2);
  return { block, start, end: close + 2 };
}

type Violation = { file: string; reason: string };
const violations: Violation[] = [];
let fixed = 0;

const project = new Project({
  tsConfigFilePath: path.join(ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

for (const sf of project.getSourceFiles(["src/**/*.ts"])) {
  const abs = sf.getFilePath();
  if (isIgnored(abs)) continue;

  const relFile = rel(abs);
  if (!relFile.startsWith("src/")) continue;

  const text = sf.getFullText();
  const topBlock = getTopBlockComment(text);

  // Helper to write a new full-file text
  const write = (content: string) => {
    if (!WRITE) return;
    fs.writeFileSync(abs, content, "utf8");
    fixed += 1;
  };

  // Helper to ensure @file/@module/@summary
  const validateAndMaybeFixHeader = (
    block: string,
  ): { ok: boolean; newBlock?: string; reasons?: string[] } => {
    const reasons: string[] = [];
    const expectedFile = relFile;
    const expectedModule = moduleFromFile(relFile);

    const hasFile = /@file\s+([^\n\r]+)/.test(block);
    const hasModule = /@module\s+([^\n\r]+)/.test(block);
    const hasSummary = /@summary\s+([^\n\r]+)/.test(block);

    if (!hasFile) reasons.push("missing @file");
    if (!hasModule) reasons.push("missing @module");
    if (!hasSummary) reasons.push("missing @summary");

    let newBlock = block;

    // Insert missing tags just before closing */
    const insertBefore = (tag: string, value: string) => {
      newBlock = newBlock.replace(/\*\/\s*$/, ` * ${tag} ${value}\n */`);
    };

    if (!hasFile) insertBefore("@file", expectedFile);
    if (!hasModule) insertBefore("@module", expectedModule);
    if (!hasSummary) insertBefore("@summary", defaultSummary(relFile));

    // Fix mismatches
    const mFile = block.match(/@file\s+([^\n\r]+)/);
    if (mFile && mFile[1].trim() !== expectedFile) {
      reasons.push(`@file mismatch (expected ${expectedFile})`);
      newBlock = newBlock.replace(/@file\s+[^\n\r]+/, `@file ${expectedFile}`);
    }
    const mModule = block.match(/@module\s+([^\n\r]+)/);
    if (mModule && mModule[1].trim() !== expectedModule) {
      reasons.push(`@module mismatch (expected ${expectedModule})`);
      newBlock = newBlock.replace(/@module\s+[^\n\r]+/, `@module ${expectedModule}`);
    }

    // If we inserted any missing summary, keep it; otherwise we accept whatever summary exists.
    return {
      ok: reasons.length === 0,
      newBlock,
      reasons,
    };
  };

  if (isSchemaFile(abs)) {
    // --- SCHEMA FILES: only check the very first block header ---
    if (!topBlock) {
      const header = buildHeader(relFile);
      if (WRITE) {
        write(header + text);
      } else {
        violations.push({ file: relFile, reason: "missing JsDoc header" });
      }
      continue;
    }

    const { ok, newBlock, reasons } = validateAndMaybeFixHeader(topBlock.block);
    if (!ok) {
      if (WRITE && newBlock) {
        const newText = text.slice(0, topBlock.start) + newBlock + text.slice(topBlock.end);
        write(newText);
      } else {
        violations.push({ file: relFile, reason: reasons!.join("; ") });
      }
    }
    // Note: we intentionally do nothing with subsequent doc blocks in schema files.
    continue;
  }

  // --- NON-SCHEMA FILES: enforce header and fix/insert as needed ---
  if (!topBlock) {
    const header = buildHeader(relFile);
    if (WRITE) {
      write(header + text);
    } else {
      violations.push({ file: relFile, reason: "missing JsDoc header" });
    }
    continue;
  }

  const { ok, newBlock, reasons } = validateAndMaybeFixHeader(topBlock.block);
  if (!ok) {
    if (WRITE && newBlock) {
      const newText = text.slice(0, topBlock.start) + newBlock + text.slice(topBlock.end);
      write(newText);
    } else {
      violations.push({ file: relFile, reason: reasons!.join("; ") });
    }
  }
}

// Report
if (WRITE) {
  console.log(`JsDoc header fix complete. Files updated: ${fixed}`);
  process.exit(0);
}

if (violations.length) {
  console.error("JsDoc header check failed:");
  for (const v of violations) console.error(` - ${v.file}: ${v.reason}`);
  process.exit(1);
}
console.log("JsDoc header check passed.");
