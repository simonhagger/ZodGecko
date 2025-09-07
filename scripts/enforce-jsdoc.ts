// scripts/enforce-jsdoc.ts
// Merged: file headers + exported declarations TSDoc/JSDoc normalizer
// Modes: --dry-run --out <path> | --write

import {
  Project,
  Node,
  SourceFile,
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
  JSDoc,
  JSDocTag,
  Type,
  // REMOVE: ExportDeclaration, ExportSpecifier, TypeNode (unused)
  // ADD: SyntaxKind (used instead of magic number 173)
  SyntaxKind, // ← ADD THIS
} from "ts-morph"; // ← REPLACE the import block above accordingly
import * as path from "node:path";
import * as fs from "node:fs";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SCHEMAS = path.join(SRC, "schemas");

// ---- CLI ----
const WRITE = process.argv.includes("--write");
const DRY = process.argv.includes("--dry-run");
const OUT_PATH = (() => {
  const i = process.argv.indexOf("--out");
  return i >= 0 && process.argv[i + 1]
    ? path.resolve(process.argv[i + 1])
    : path.resolve("jsdoc-preview.txt");
})();
const DO_EDIT = WRITE || DRY;

// ---- Config ----
const EXCLUDE_TESTS = true;
const IGNORE_REL = new Set<string>(["src/registry/generated.ts"]);
const isIgnoredFile = (abs: string) => {
  const r = rel(abs);
  if (IGNORE_REL.has(r)) return true;
  if (!EXCLUDE_TESTS) return false;
  return /\b(__tests__|__fixtures__|__mocks__)\b/.test(r) || /(\.spec|\.test)\.ts$/.test(r);
};
const MAX_TYPE_LEN = 120;

// ---- Reporting ----
type ReportEntry = { file: string; before: string; after: string };
const report: ReportEntry[] = [];
let fixed = 0;

// ---- FS helpers ----
const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");
const isUnder = (dir: string, file: string) => {
  const r = path.relative(dir, file);
  return !!r && !r.startsWith("..") && !path.isAbsolute(r);
};
const isSchemaFile = (abs: string) => isUnder(SCHEMAS, abs);

// ---- JSDoc helpers ----
const bumpFix = () => {
  fixed += 1;
};
const normalizeComment = (c: ReturnType<JSDoc["getComment"]>) =>
  typeof c === "string"
    ? c
    : Array.isArray(c)
      ? c.map((p: any) => p?.getText?.() ?? "").join("")
      : "";
const jsDocOf = (node: Node) => ((node as any).getJsDocs?.() as JSDoc[] | undefined)?.[0];
const isHeaderDoc = (doc: JSDoc) => {
  const names = doc.getTags().map((t) => t.getTagName());
  if (names.includes("file") || names.includes("module")) return true;
  const txt = normalizeComment(doc.getComment()).toLowerCase();
  return /@file|@module/.test(txt);
};
const tagText = (tag: JSDocTag) => {
  const c = (tag as any).getComment?.();
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p: any) => p?.getText?.() ?? "").join("");
  return tag.getText?.() ?? "";
};

function ensureTagOnce(doc: JSDoc, tagName: string, text: string) {
  const exists = doc
    .getTags()
    .some((t) => t.getTagName() === tagName && tagText(t).trim() === text.trim());
  if (!exists) doc.addTag({ tagName, text });
}
function findHeaderInsertPos(text: string): number {
  // shebang
  if (text.startsWith("#!")) {
    const nl = text.indexOf("\n");
    return nl >= 0 ? nl + 1 : text.length;
  }
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);

    const ws = rest.match(/^(\s+)/);
    if (ws) {
      i += ws[1].length;
      continue;
    }

    const ref = rest.match(/^\/\/\/\s*<reference[^>]*>.*\r?\n/);
    if (ref) {
      i += ref[0].length;
      continue;
    }

    const block = rest.match(/^\/\*[\s\S]*?\*\//);
    if (block) {
      i += block[0].length;
      continue;
    }

    const line = rest.match(/^\/\/.*\r?\n/);
    if (line) {
      i += line[0].length;
      continue;
    }

    break;
  }
  return i;
}
function replaceSingleTag(doc: JSDoc | undefined, tagName: string, text: string) {
  if (!DO_EDIT || !doc) return;
  doc
    .getTags()
    .filter((t) => t.getTagName() === tagName)
    .forEach((t) => t.remove());
  doc.addTag({ tagName, text });
}

function consolidateJsDocs(host: Node, fallbackSummary: string): JSDoc {
  const all = ((host as any).getJsDocs?.() as JSDoc[] | undefined) ?? [];
  const nonHeader = all.filter((d) => !isHeaderDoc(d));
  let primary = nonHeader.find((d) => /\S/.test(normalizeComment(d.getComment()))) ?? nonHeader[0];
  if (!primary) {
    primary = (host as any).addJsDoc({ description: fallbackSummary });
    bumpFix();
    return primary;
  }
  for (const d of nonHeader)
    if (d !== primary)
      for (const t of d.getTags()) ensureTagOnce(primary, t.getTagName(), tagText(t));
  if (!/\S/.test(normalizeComment(primary.getComment()))) {
    const tags = primary.getTags().map((t) => ({ tagName: t.getTagName(), text: tagText(t) }));
    primary.remove();
    primary = (host as any).addJsDoc({ description: fallbackSummary, tags });
    bumpFix();
  }
  for (const d of nonHeader) if (d !== primary) d.remove();
  return primary;
}

function normalizeExampleTags(doc?: JSDoc) {
  if (!doc) return;
  for (const tag of doc.getTags().filter((t) => t.getTagName() === "example")) {
    const current = tagText(tag);
    const normalized = current
      .replace(/```(?:[a-zA-Z0-9_-]+)?\r?\n([\s\S]*?)\r?\n```/g, "$1")
      .replace(/```/g, "")
      .trim();
    if (normalized !== current) {
      const p = tag.getParent();
      tag.remove();
      (p as JSDoc).addTag({ tagName: "example", text: normalized });
      bumpFix();
    }
  }
}

// ---- Type rendering ----
const capDocType = (t: string) => (t && t.length > MAX_TYPE_LEN ? "complex type" : t);
const looksNoisyType = (s: string) => {
  if (!s) return false;
  const str = s.trim();
  if (str.length > 200) return true;
  if (/\bzod\./i.test(str)) return true;
  if (/import\("/.test(str)) return true;
  // too many braces or tuples
  const braceCount = (str.match(/[{}]/g) || []).length;
  if (braceCount >= 6) return true;
  // extremely long tuple/array literals
  if (/readonly\s*\[/.test(str) && str.length > 160) return true;
  return false;
};
const sanitizeType = (s: string) =>
  s
    .replace(/import\(".*?node_modules\/([^/"]+)\/index"\)\./g, (_, p) => `${p}.`)
    .replace(/import\(".*?"\)\./g, "")
    .replace(/\s+/g, " ")
    .replace(/\b__object\b/g, "object")
    .replace(/\b__type\b/g, "object")
    .trim();

// primitive/atom checker used by literalUnionText
function isPrimitiveAtom(s: string): boolean {
  const t = (s ?? "").trim();
  // built-in primitives & common top-level keywords
  if (/^(string|number|boolean|bigint|null|undefined|symbol|object|unknown|never|void)$/.test(t)) {
    return true;
  }
  // literal strings/numbers/template-literals
  if (/^["'`].*["'`]$/.test(t)) return true;
  // simple identifiers (AliasName, EnumMember)
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) return true;
  return false;
}

// --- tuple/array helpers (ported & trimmed) ---------------------------------

function isTupleType(t: Type): boolean {
  return typeof (t as any).getTupleElements === "function";
}

function tupleElementTypes(t: Type): Type[] {
  const anyT = t as any;
  return typeof anyT.getTupleElements === "function" ? (anyT.getTupleElements() as Type[]) : [];
}

function isTupleText(txt: string): boolean {
  const s = txt.trim();
  // tuple starts with [ or readonly [
  if (!/^(?:readonly\s*)?\[/.test(s)) return false;
  // index signature looks like: [k: string]: X
  // if there's a ':' before the closing ']', it's an index signature, not a tuple
  const m = s.match(/\[(.*?)\]/);
  return !!m && !m[1].includes(":");
}

function isArrayCtorText(txt: string): boolean {
  const s = txt.trim();
  return /^Array<.*>$/.test(s) || /^ReadonlyArray<.*>$/.test(s) || /\[\]$/.test(s);
}

function isArrayLikeText(txt: string): boolean {
  const s = txt.trim();
  return isArrayCtorText(s) || isTupleText(s);
}

function replaceSingleTagPreferShorter(doc: JSDoc | undefined, tagName: string, nextText: string) {
  if (!DO_EDIT || !doc) return;
  const existing = doc.getTags().find((t) => t.getTagName() === tagName);
  const next = nextText.trim();
  if (existing) {
    const cur = tagText(existing).trim();
    // If current is already specific & not longer, keep it.
    if (/^Type:\s+/.test(cur) && cur.length <= next.length && !looksNoisyType(cur)) return;
    existing.remove();
  }
  doc.addTag({ tagName, text: next });
}

function elementTypeStringFromText(raw: string): string | undefined {
  raw = raw.trim();
  const m1 = raw.match(/^ReadonlyArray<(.+)>$/);
  if (m1) return m1[1].trim() || undefined; // ← ensure non-empty
  const m2 = raw.match(/^Array<(.+)>$/);
  if (m2) return m2[1].trim() || undefined; // ← ensure non-empty
  if (/\[\]$/.test(raw)) {
    const inner = raw.replace(/\[\]$/, "").trim();
    return inner || undefined; // ← ensure non-empty
  }
  return undefined;
}

// literal-union pretty-printer helpers
function literalUnionText(host: Node, T: Type): string | undefined {
  const parts = typeof T.getUnionTypes === "function" ? T.getUnionTypes() : [];
  if (!parts.length) return undefined;

  const atoms = parts.map((u) => sanitizeType(u.getText(host))).filter(Boolean);
  if (!atoms.length) return undefined;

  // collapse true|false → boolean (readability)
  const set = new Set(atoms);
  if (set.has("true") && set.has("false")) {
    set.delete("true");
    set.delete("false");
    set.add("boolean");
  }
  const uniq = Array.from(set);

  // only accept unions made from "simple" atoms
  if (!uniq.every(isPrimitiveAtom)) return undefined;

  const joined = uniq.join(" | ");
  if (joined.length > MAX_TYPE_LEN || uniq.length > 8) return undefined;

  return joined;
}

function templateLiteralText(aliasText: string): string | undefined {
  const s = aliasText.trim();
  // Keep concise template literal forms like `${ApiVersion}/${ApiPlan}`
  if (/^`.*`$/.test(s) || /\$\{/.test(s)) {
    if (!looksNoisyType(s) && s.length <= MAX_TYPE_LEN) return s;
  }
  return undefined;
}

function elementTypeDescription(node: Node, t: Type): string {
  if (t.isArray()) {
    const el = t.getArrayElementType();
    if (!el) return "unknown";
    const sym = el.getSymbol()?.getName();
    if (sym && sym !== "__type") return sym;
    const compact = sanitizeType(compactTypeText(node, el));
    if (!compact || compact === "object" || looksNoisyType(compact)) return "unknown";
    return compact;
  }

  if (isTupleType(t)) {
    const elems = tupleElementTypes(t);
    const names = elems
      .map((e) => e.getSymbol()?.getName() || sanitizeType(compactTypeText(node, e)))
      .map((s) => (s === "__type" || s === "__object" ? "object" : s))
      .filter((s) => s && !looksNoisyType(s));
    const uniq = Array.from(new Set(names));
    return uniq.length ? uniq.join(" | ") : "unknown";
  }

  const raw = sanitizeType(t.getText(node));
  const app = sanitizeType(t.getApparentType().getText(node));
  const from =
    raw.match(/^ReadonlyArray<(.+)>$/)?.[1] ??
    raw.match(/^Array<(.+)>$/)?.[1] ??
    (/\[\]$/.test(raw) ? raw.replace(/\[\]$/, "") : undefined) ??
    app.match(/^ReadonlyArray<(.+)>$/)?.[1] ??
    app.match(/^Array<(.+)>$/)?.[1] ??
    (/\[\]$/.test(app) ? app.replace(/\[\]$/, "") : undefined);

  if (!from) return "unknown";
  const clean = sanitizeType(from);
  if (!clean || clean === "object" || looksNoisyType(clean)) return "unknown";
  return clean;
}

function compactTypeText(node: Node, t: Type = (node as any).getType?.()): string {
  if (!t) return "unknown";

  const sym = t.getSymbol()?.getName();
  if (sym && sym !== "__type") return sym;

  const raw = t.getText(node).trim();
  const app = t.getApparentType().getText(node).trim();

  // Tuples
  if (isTupleType(t)) {
    const elems = tupleElementTypes(t);
    const parts = elems
      .map((e) => e.getSymbol()?.getName() || sanitizeType(compactTypeText(node, e)))
      .map((s) => (s === "__type" || s === "__object" ? "object" : s));

    const tooMany = parts.length > 5;
    const looksBad = parts.some((p) => p === "object" || looksNoisyType(p));
    if (tooMany || looksBad) {
      const el = elementTypeDescription(node, t);
      const ro = /^readonly\b/.test(raw) || /^readonly\b/.test(app);
      const ctor = ro ? "ReadonlyArray" : "Array";
      return `${ctor}<${el === "unknown" ? "unknown" : el}>`;
    }

    const inner = parts.join(", ");
    const roPrefix = /^readonly\b/.test(raw) || /^readonly\b/.test(app) ? "readonly " : "";
    const txt = `${roPrefix}[${inner}]`;
    return txt.length <= MAX_TYPE_LEN ? txt : `Array<${elementTypeDescription(node, t)}>`;
  }

  // Arrays (avoid index-signature false positives)
  if (t.isArray() || isArrayCtorText(raw) || isArrayCtorText(app)) {
    const el = elementTypeDescription(node, t);
    const isReadonly =
      /^ReadonlyArray<.*>$/.test(app) ||
      /^ReadonlyArray<.*>$/.test(raw) ||
      /^readonly\b/.test(raw) ||
      /^readonly\b/.test(app);
    const ctor = isReadonly ? "ReadonlyArray" : "Array";
    return `${ctor}<${el === "unknown" ? "unknown" : el}>`;
  }

  if (t.isUnion()) {
    let parts = t.getUnionTypes().map((u) => u.getSymbol()?.getName() || compactTypeText(node, u));
    const set = new Set(parts);
    if (set.has("true") && set.has("false")) {
      parts = ["boolean", ...parts.filter((p) => p !== "true" && p !== "false")];
    }
    const uniq = Array.from(
      new Set(parts.map((p) => (p === "__object" || p === "__type" ? "object" : p))),
    );
    const joined = uniq.join(" | ");
    return joined.length <= MAX_TYPE_LEN ? joined : `union(${uniq.length})`;
  }

  if (t.isIntersection()) {
    const parts = t.getIntersectionTypes().map((u) => compactTypeText(node, u));
    const uniq = Array.from(new Set(parts));
    const joined = uniq.join(" & ");
    return joined.length <= MAX_TYPE_LEN ? joined : `intersection(${uniq.length})`;
  }

  if (raw.startsWith("{") && raw.endsWith("}")) return "object";

  return sanitizeType(raw) || "object";
}

const typeDisplay = (t: string) => {
  const s = sanitizeType(t);
  // Only coerce when it's *exactly* the broad object array.
  if (s === "Array<object>") return "Array<unknown>";
  if (s === "ReadonlyArray<object>") return "ReadonlyArray<unknown>";
  return capDocType(s);
};
const typeOf = (node: Node, t?: Type) =>
  typeDisplay(compactTypeText(node, t ?? (node as any).getType?.()));

const safeType = (t?: string) => {
  const s = (t ?? "").trim();
  // guard against accidental empty or placeholder "[]"
  if (!s || s === "[]" || s === "[ ]") return "unknown";
  return s;
};
const typeTextRaw = (host: Node, t: Type) => sanitizeType(t.getText(host));

const isIndexedOrTypeof = (aliasText: string) =>
  /\btypeof\s+/.test(aliasText) || /\[[^\]]+\]\s*$/.test(aliasText) || /\bkeyof\b/.test(aliasText);

function looksNoisyAliasText(s: string): boolean {
  if (!s) return true;
  const t = s.trim();

  // Allow short template literals and small tuples
  if (/^\$\{[^}]+\}\/\$\{[^}]+\}$/.test(t)) return false;
  if (/^(?:readonly\s*)?\[[^[\]]{0,60}\]$/.test(t)) return false;

  // ✅ Treat common helper generics as noisy even when short
  if (
    /\b(?:Extract|Omit|Pick|Record|Partial|Required|Exclude|NonNullable|ReturnType|InstanceType|Parameters|Readonly|ReadonlyArray|Mutable)\s*</.test(
      t,
    )
  ) {
    return true;
  }

  // ✅ Multi-argument generics like Foo<A,B> → noisy
  if (/<[^>]*,[^>]*>/.test(t)) return true;

  // ✅ Mapped types ( […] in … ) → noisy
  if (/\[\s*[^:\]]+\s+in\s+/.test(t)) return true;

  // Keep these “complex” bans only when long:
  if (/\bkeyof\b/.test(t) && t.length > MAX_TYPE_LEN) return true;
  if (/\bextends\b[^?]*\?[^:]*:/.test(t) && t.length > MAX_TYPE_LEN) return true;

  if (/\[[^\]]+\]\s*:/.test(t)) return true; // index sig literal
  if (/\breadonly\b\s*\{/.test(t)) return true; // big readonly object literal
  if (/[{]/.test(t) && t.length > 80) return true; // large object literal
  if (t.length > MAX_TYPE_LEN) return true;
  if (/\bimport\(/.test(t) || /\bzod\./i.test(t)) return true;

  return false;
}

const clampArrayRemark = (raw: string): string => {
  // If an array/tuple literal is too noisy, compress it
  if (/readonly\s*\[/.test(raw)) {
    if (raw.length > MAX_TYPE_LEN || /{/.test(raw)) return "ReadonlyArray<object>";
    return raw; // small tuple is fine
  }
  if (/\[.*\]/.test(raw)) {
    if (raw.length > MAX_TYPE_LEN || /{/.test(raw)) return "Array<object>";
    return raw;
  }
  return raw;
};

// ---- micro helpers ----
function upsertDoc(host: Node, summary: string): JSDoc {
  return consolidateJsDocs(host, summary);
}
function upsertTags(doc: JSDoc | undefined, specs: { tag: string; text: string }[]) {
  if (!DO_EDIT || !doc) return;
  for (const s of specs) ensureTagOnce(doc, s.tag, s.text);
}
function replaceTags(doc: JSDoc | undefined, tagName: string, lines: string[]) {
  if (!DO_EDIT || !doc) return;
  doc
    .getTags()
    .filter((t) => t.getTagName() === tagName)
    .forEach((t) => t.remove());
  for (const l of lines) doc.addTag({ tagName, text: l });
}
function finalizeDoc(doc: JSDoc | undefined) {
  if (!DO_EDIT || !doc) return;
  normalizeExampleTags(doc);
  bumpFix();
}

// ---- headers ----
function firstTopLevelHost(_sf: SourceFile): Node | undefined {
  // No longer used for header placement — we now write top-of-file headers directly to the SourceFile text.
  return undefined;
}
function ensureFileHeader(sf: SourceFile) {
  if (!DO_EDIT) return;

  const relPath = rel(sf.getFilePath());
  const moduleName = relPath.replace(/\.ts$/i, "");

  // Construct the header block exactly once.
  const headerBlock =
    `/** @file ${relPath}\n` +
    ` * @module ${moduleName}\n` +
    ` * @summary Module ${moduleName}\n` +
    ` */\n`;

  const text = sf.getFullText();
  const probe = text.slice(0, Math.min(text.length, 4000)); // small window is enough
  if (/\/\*\*[\s\S]*?@file[\s\S]*?@module[\s\S]*?\*\//.test(probe)) return;

  const pos = findHeaderInsertPos(text);
  const anySf = sf as any;
  if (typeof anySf.insertText === "function") anySf.insertText(pos, headerBlock);
  else sf.replaceWithText(text.slice(0, pos) + headerBlock + text.slice(pos));
  bumpFix();
}

// ---- collectors ----
function collectExported(sf: SourceFile) {
  const fns: Array<{ node: FunctionDeclaration | ArrowFunction; name: string }> = [];
  const consts: Array<{ node: VariableDeclaration; name: string; arrow?: ArrowFunction }> = [];
  const types: TypeAliasDeclaration[] = [];
  const ifaces: InterfaceDeclaration[] = [];
  const enums: EnumDeclaration[] = [];
  sf.getFunctions().forEach((fn) => {
    if (fn.isExported()) fns.push({ node: fn, name: fn.getName() ?? "default" });
  });
  sf.getVariableStatements().forEach((vs) => {
    if (!vs.isExported()) return;
    vs.getDeclarations().forEach((vd) => {
      const init = vd.getInitializer();
      const arrow = init && Node.isArrowFunction(init) ? init : undefined;
      consts.push({ node: vd, name: vd.getName(), arrow });
    });
  });
  sf.getTypeAliases().forEach((t) => t.isExported() && types.push(t));
  sf.getInterfaces().forEach((i) => i.isExported() && ifaces.push(i));
  sf.getEnums().forEach((e) => e.isExported() && enums.push(e));
  return { fns, consts, types, ifaces, enums };
}

// ---- param rendering ----
function getParams(node: FunctionDeclaration | ArrowFunction) {
  return node.getParameters().map((p) => {
    const name = p.getName();
    const isRest = p.isRestParameter();
    const isOptional = p.hasQuestionToken() || !!p.getInitializer() || isRest;
    const displayName = isRest ? `...${name}` : name;
    const defaultText = p.getInitializer()?.getText().trim();
    const tNode = p.getTypeNode();
    const typeText = tNode ? tNode.getText() : compactTypeText(p);
    return { name: displayName, isOptional, defaultText, typeText };
  });
}
const paramLinesFor = (node: FunctionDeclaration | ArrowFunction) =>
  getParams(node).map(
    (p) =>
      `${p.name} (${p.isOptional ? "optional" : "required"}: ${safeType(sanitizeType(p.typeText || "unknown"))})${p.defaultText ? ` [default=${p.defaultText}]` : ""}`,
  );

// ---- ensure* ----
const getFnHost = (n: FunctionDeclaration | ArrowFunction) =>
  Node.isFunctionDeclaration(n)
    ? n
    : (() => {
        let c: Node | undefined = n;
        while (c && !Node.isVariableStatement(c)) c = c.getParent();
        return c ?? n;
      })();
const getVarHost = (d: VariableDeclaration) => {
  let c: Node | undefined = d;
  while (c && !Node.isVariableStatement(c)) c = c.getParent();
  return c ?? d.getParentOrThrow();
};

function ensureFunctionDoc(
  _sf: SourceFile,
  node: FunctionDeclaration | ArrowFunction,
  name: string,
) {
  const host = getFnHost(node);
  if (!DO_EDIT) {
    const d = jsDocOf(host);
    const ok =
      d &&
      !isHeaderDoc(d) &&
      /\S/.test(normalizeComment(d.getComment())) &&
      d.getTags().some((t) => t.getTagName() === "param") &&
      d.getTags().some((t) => t.getTagName().startsWith("return"));
    if (!ok) return;
  }
  const doc = upsertDoc(host, `Function ${name}.`);
  replaceTags(doc, "param", paramLinesFor(node));
  // avoid duplicate @returns by replacing (not appending)
  const rNode = (node as any).getReturnTypeNode?.();
  const retText = rNode ? rNode.getText() : typeOf(node, node.getReturnType());
  replaceSingleTag(doc, "returns", safeType(retText));
  finalizeDoc(doc);
}

function ensureConstDoc(_sf: SourceFile, decl: VariableDeclaration, name: string) {
  if (!DO_EDIT) return;

  const arrow = Node.isArrowFunction(decl.getInitializer())
    ? (decl.getInitializer() as ArrowFunction)
    : undefined;
  if (arrow) return ensureFunctionDoc(_sf, arrow, name);

  const host = getVarHost(decl);
  const doc = upsertDoc(host, `Constant ${name}.`);

  // Prefer `typeof NAME` for anything that’s object/array/complex to avoid verbose expansions.
  const init = decl.getInitializer();
  const isObjOrArr =
    !!init &&
    (Node.isObjectLiteralExpression(init) ||
      Node.isArrayLiteralExpression(init) ||
      (init.getKind &&
        (init.getKind() === SyntaxKind.ObjectLiteralExpression ||
          init.getKind() === SyntaxKind.ArrayLiteralExpression)));
  const tnode = (decl as any).getTypeNode?.();

  let tt: string;
  if (isObjOrArr) {
    tt = `typeof ${name}`;
  } else if (tnode) {
    tt = typeDisplay(tnode.getText());
  } else {
    const compact = typeOf(decl, decl.getType());
    tt = looksNoisyType(compact) ? `typeof ${name}` : compact;
  }

  replaceSingleTagPreferShorter(doc, "remarks", `Type: ${safeType(tt)}`);
  finalizeDoc(doc);
}

const preferAliasText = (s: string | undefined) => (!!s && !looksNoisyAliasText(s) ? s : undefined);

function ensureTypeAliasDoc(_sf: SourceFile, t: TypeAliasDeclaration) {
  const name = t.getName();
  if (!DO_EDIT) {
    const d = jsDocOf(t);
    const ok = d && !isHeaderDoc(d) && /\S/.test(normalizeComment(d.getComment()));
    if (!ok) return;
  }

  const doc = upsertDoc(t, `Type alias ${name}.`);
  const T = t.getType();
  const aliasText = sanitizeType(t.getTypeNode()?.getText() ?? "");
  const apparent = T.getApparentType();
  const isConditional = /\bextends\b[^?]*\?[^:]*:/.test(aliasText);

  // 1) Prefer a readable literal union when we can see it (ApiVersion, ApiPlan, etc.)
  const literalUnion =
    (T.isUnion() && literalUnionText(t, T)) ||
    (apparent.isUnion?.() && literalUnionText(t, apparent));
  if (literalUnion) {
    replaceSingleTagPreferShorter(doc, "remarks", `Type: ${literalUnion}`);
    return finalizeDoc(doc);
  }

  // 2) Prefer concise template literal renderings (e.g. `${ApiVersion}/${ApiPlan}`)
  const templateLit = templateLiteralText(aliasText);
  if (templateLit) {
    replaceSingleTagPreferShorter(doc, "remarks", `Type: ${templateLit}`);
    return finalizeDoc(doc);
  }

  // 3) Arrays / Tuples → compact (but avoid noisy/overlong tuple text)
  const raw = sanitizeType(T.getText(t));
  if (isTupleText(raw) || T.isArray() || isArrayCtorText(raw)) {
    // small readable tuple → keep
    if (isTupleText(raw) && raw.length <= MAX_TYPE_LEN && !looksNoisyAliasText(raw)) {
      replaceSingleTagPreferShorter(doc, "remarks", `Type: ${raw}`);
      return finalizeDoc(doc);
    }
    // otherwise compress to Array/ReadonlyArray<elem>, or fall back to alias name if still ugly
    const el = elementTypeDescription(t, T);
    const ro = /^readonly\b/.test(raw) ? "ReadonlyArray" : "Array";
    const compact = `${ro}<${el === "unknown" ? "unknown" : el}>`;
    const chosen = looksNoisyAliasText(compact) ? name : compact;
    replaceSingleTagPreferShorter(doc, "remarks", `Type: ${chosen}`);
    return finalizeDoc(doc);
  }

  // 4) Object-literal members → @property lines (keep concise)
  const lit = t.getTypeNode();
  if (lit && lit.getKind?.() === SyntaxKind.TypeLiteral) {
    const txt = sanitizeType(lit.getText());
    if (!looksNoisyType(txt) && txt.length <= MAX_TYPE_LEN) {
      const members = (lit as any).getMembers?.() as any[] | undefined;
      const lines: string[] = [];
      if (members) {
        for (const m of members) {
          if (typeof (m as any).getName !== "function") continue;
          const nm = (m as any).getName();
          const opt = (m as any).hasQuestionToken?.() ? "optional" : "required";
          const tn = (m as any).getTypeNode?.();
          const tt = tn ? typeDisplay((tn as any).getText()) : typeOf(m as any);
          lines.push(`${nm} (${opt}: ${safeType(tt)}).`);
        }
      }
      if (lines.length) {
        replaceTags(doc, "property", lines);
        return finalizeDoc(doc);
      }
    }
  }

  // 5) Conditional / indexed / typeof / complex generics:
  //    Never explode helper signatures (Extract/Omit/Pick/Record/…)
  //    Prefer the alias *name* for these shapes.
  const isIndexedOrTypeofAlias =
    /\btypeof\s+/.test(aliasText) ||
    /\[[^\]]+\]\s*$/.test(aliasText) ||
    /\bkeyof\b/.test(aliasText);

  if (isConditional || isIndexedOrTypeofAlias) {
    const chosen = preferAliasText(aliasText) ?? name;
    replaceSingleTagPreferShorter(doc, "remarks", `Type: ${typeDisplay(chosen)}`);
    return finalizeDoc(doc);
  }

  // If aliasText is a generic like Foo<...>, prefer the alias *name*
  if (/^[A-Za-z_][\w.]*\s*</.test(aliasText)) {
    replaceSingleTagPreferShorter(doc, "remarks", `Type: ${name}`);
    return finalizeDoc(doc);
  }

  // Default: clean alias text if not noisy, else alias name
  if (aliasText && aliasText.length <= MAX_TYPE_LEN && !looksNoisyAliasText(aliasText)) {
    replaceSingleTagPreferShorter(doc, "remarks", `Type: ${aliasText}`);
  } else {
    const chosen = preferAliasText(aliasText) ?? name;
    replaceSingleTagPreferShorter(doc, "remarks", `Type: ${typeDisplay(chosen)}`);
  }
  finalizeDoc(doc);
}

function ensureInterfaceDoc(_sf: SourceFile, i: InterfaceDeclaration) {
  const name = i.getName();
  if (!DO_EDIT) {
    const d = jsDocOf(i);
    const ok = d && !isHeaderDoc(d) && /\S/.test(normalizeComment(d.getComment()));
    if (!ok) return;
  }
  const doc = upsertDoc(i, `Interface ${name}.`);
  replaceTags(
    doc,
    "property",
    i
      .getProperties()
      .map(
        (p) =>
          `${p.getName()} (${p.hasQuestionToken() ? "optional" : "required"}: ${typeDisplay(compactTypeText(p, p.getType()))})`,
      ),
  );
  finalizeDoc(doc);
}

function ensureEnumDoc(_sf: SourceFile, e: EnumDeclaration) {
  const name = e.getName();
  if (!DO_EDIT) {
    const d = jsDocOf(e);
    const ok = d && !isHeaderDoc(d) && /\S/.test(normalizeComment(d.getComment()));
    if (!ok) return;
  }
  const doc = upsertDoc(e, `Enum ${name}.`);
  replaceSingleTag(
    doc,
    "remarks",
    `Members:\n- ${e
      .getMembers()
      .map((m) => m.getName())
      .join("\n- ")}`,
  );
  finalizeDoc(doc);
}

// ---- main ----
const project = new Project({
  tsConfigFilePath: path.join(ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});
const beforeText: Record<string, string> = {};

for (const sf of project.getSourceFiles(["src/**/*.ts"])) {
  const abs = sf.getFilePath();
  if (isIgnoredFile(abs) || isSchemaFile(abs)) continue;
  beforeText[abs] = sf.getFullText();

  ensureFileHeader(sf);

  const { fns, consts, types, ifaces, enums } = collectExported(sf);
  for (const f of fns) ensureFunctionDoc(sf, f.node, f.name);
  for (const c of consts) ensureConstDoc(sf, c.node, c.name);
  for (const t of types) ensureTypeAliasDoc(sf, t);
  for (const i of ifaces) ensureInterfaceDoc(sf, i);
  for (const e of enums) ensureEnumDoc(sf, e);

  if (DRY) {
    const after = sf.getFullText();
    if (after !== beforeText[abs]) report.push({ file: rel(abs), before: beforeText[abs], after });
  }
}

// ---- finalize ----
if (DRY) {
  type Range = { bStart: number; bEnd: number; aStart: number; aEnd: number };

  function diffRanges(before: string[], after: string[]): Range[] {
    const ranges: Range[] = [];
    let bi = 0,
      ai = 0;
    const bl = before.length,
      al = after.length;
    while (bi < bl || ai < al) {
      if (bi < bl && ai < al && before[bi] === after[ai]) {
        bi++;
        ai++;
        continue;
      }
      const bStart = bi,
        aStart = ai;
      // advance until we find a sync point (simple scan window)
      let advanced = false;
      for (let look = 0; look < 200 && (bi < bl || ai < al); look++) {
        if (bi < bl) bi++;
        if (ai < al) ai++;
        advanced = true;
        if (bi < bl && ai < al && before[bi] === after[ai]) break;
      }
      if (!advanced) break;
      const bEnd = Math.min(bl - 1, bi - 1);
      const aEnd = Math.min(al - 1, ai - 1);
      ranges.push({ bStart, bEnd, aStart, aEnd });
    }
    return ranges;
  }

  function emitHunks(before: string, after: string, ctx = 2, maxHunks = 8) {
    const b = before.split(/\r?\n/);
    const a = after.split(/\r?\n/);
    if (before === after) return ["(no changes)"];
    const ranges = diffRanges(b, a);
    const out: string[] = [];
    let count = 0;
    for (const r of ranges) {
      if (count >= maxHunks) {
        out.push("... (more hunks omitted)");
        break;
      }
      const bFrom = Math.max(0, r.bStart - ctx);
      const bTo = Math.min(b.length - 1, r.bEnd + ctx);
      const aFrom = Math.max(0, r.aStart - ctx);
      const aTo = Math.min(a.length - 1, r.aEnd + ctx);

      out.push("--- BEFORE (hunk) ---");
      out.push(...b.slice(bFrom, bTo + 1));
      out.push("--- AFTER (hunk) ----");
      out.push(...a.slice(aFrom, aTo + 1));
      out.push("");
      count++;
    }
    return out.length ? out : ["(no changes)"];
  }

  const lines: string[] = [];
  lines.push("# JSDoc — Dry Run Report");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  for (const { file, before, after } of report) {
    lines.push(`===== FILE: ${file} =====`);
    lines.push(...emitHunks(before, after, 2, 8));
  }

  fs.writeFileSync(OUT_PATH, lines.join("\n"), "utf8");
  console.log(`Dry run complete → ${OUT_PATH}`);
  process.exit(0);
}

if (WRITE) {
  project.saveSync();
  console.log(`Write complete. Files updated: ${fixed}`);
  process.exit(0);
}

console.log(`Scan complete. Potential edits: ${fixed}`);
