// scripts/enforce-jsdoc-exports.ts
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
  ExportDeclaration,
  ExportSpecifier,
  TypeNode,
  TypeLiteralNode,
  TypeReferenceNode,
  Node as TsNode,
  SyntaxKind,
} from "ts-morph";
import * as path from "node:path";
import * as fs from "node:fs";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SCHEMAS = path.join(SRC, "schemas");

// ---- CLI flags ----
const WRITE = process.argv.includes("--write");
const DRY = process.argv.includes("--dry-run");
const OUT_PATH = (() => {
  const i = process.argv.indexOf("--out");
  return i >= 0 && process.argv[i + 1]
    ? path.resolve(process.argv[i + 1])
    : path.resolve("jsdoc-exports.dryrun.txt");
})();
const DO_EDIT = WRITE || DRY; // Only mutate AST if write or dry-run (dry-run mutations are in-memory only)
const EXCLUDE_TESTS = true;

const IGNORE = new Set<string>([path.join(SRC, "registry", "generated.ts")]);

const MAX_TYPE_LEN = 120;

function collapseBooleanParts(parts: string[]): string[] {
  const set = new Set(parts.map((p) => p.trim()));
  if (set.has("true") && set.has("false")) {
    const rest = parts.filter((p) => p !== "true" && p !== "false");
    return Array.from(new Set(["boolean", ...rest]));
  }
  return Array.from(new Set(parts));
}
function sortPrimitiveUnion(parts: string[]): string[] {
  const order = new Map<string, number>([
    ["string", 1],
    ["number", 2],
    ["boolean", 3],
    ["bigint", 4],
    ["symbol", 5],
    ["null", 6],
    ["undefined", 7],
    ["object", 8],
  ]);
  return [...parts].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

function capDocType(t: string): string {
  return t && t.length > MAX_TYPE_LEN ? "complex type" : t;
}
function isSimpleAtom(s: string): boolean {
  return (
    /^(string|number|boolean|bigint|null|undefined|symbol|object)$/.test(s) ||
    /^"[^"]*"$/.test(s) ||
    /^'[^']*'$/.test(s) ||
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(s)
  );
}

// ---- reporting (dry-run) ----
type ReportEntry = { file: string; before: string; after: string };
const report: ReportEntry[] = [];

type Violation = { file: string; kind: string; name: string; reason: string };
const violations: Violation[] = [];
let fixed = 0;

// ----------------- utils -----------------
const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");
const isUnder = (dir: string, file: string) => {
  const r = path.relative(dir, file);
  return !!r && !r.startsWith("..") && !path.isAbsolute(r);
};
const isIgnoredFile = (abs: string) => {
  if (IGNORE.has(abs)) return true;
  if (EXCLUDE_TESTS) {
    const r = rel(abs);
    if (/\b(__tests__|__fixtures__|__mocks__)\b/.test(r)) return true;
    if (/(\.spec|\.test)\.ts$/.test(r)) return true;
  }
  return false;
};
const isSchemaFile = (abs: string) => isUnder(SCHEMAS, abs);
const isInSrc = (abs: string) => isUnder(SRC, abs);

function isTupleType(t: Type): boolean {
  return ((t as any).isTuple?.() ?? false) === true;
}

// stdlib / node_modules guard
function isExternalDeclFile(fp: string) {
  const n = fp.replace(/\\/g, "/");
  return /node_modules\//.test(n) || /typescript\/lib\/lib\./.test(n);
}

function recordViolation(sf: SourceFile, kind: string, name: string, reason: string) {
  violations.push({ file: rel(sf.getFilePath()), kind, name, reason });
}
function bumpFix() {
  fixed += 1;
}
/** If the alias is `Readonly<{ ... }>` or `Readonly<Something>`, unwrap to the inner type node. */
function unwrapReadonly(node: TypeNode | undefined): TypeNode | undefined {
  if (!node) return node;
  if (!TsNode.isTypeReference(node)) return node;
  const name = node.getTypeName().getText();
  if (name !== "Readonly") return node;
  const args = node.getTypeArguments();
  return args[0] ?? node;
}

/** Try to get the TypeLiteralNode `{ ... }` from the declared alias, unwrapping Readonly<...>. */
function declaredTypeLiteral(t: TypeAliasDeclaration): TypeLiteralNode | undefined {
  const base = t.getTypeNode?.();
  const unwrapped = unwrapReadonly(base);
  if (unwrapped && TsNode.isTypeLiteral(unwrapped)) return unwrapped;
  return undefined;
}

function normalizeInlineUnionText(s: string): string {
  // collapse whitespace around pipes and remove any leading pipe
  let out = s.replace(/\s*\|\s*/g, " | ").replace(/^\s*\|\s*/, "");
  // de-dupe accidental double spaces
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

/** Read declared props (name, optional, type text) from a TypeLiteralNode. */
function readDeclaredPropsFromLiteral(
  lit: TypeLiteralNode,
): Array<{ name: string; optional: boolean; typeText: string }> {
  const props: Array<{ name: string; optional: boolean; typeText: string }> = [];
  for (const m of lit.getMembers()) {
    if (!TsNode.isPropertySignature(m)) continue;
    const name = m.getName();
    const optional = m.hasQuestionToken?.() ?? false;
    const tn = m.getTypeNode?.();
    let typeText = tn ? sanitizeTypeTextForDocs(tn.getText()) : "";
    if (!typeText || /\b__type\b/.test(typeText)) {
      // fallback to checker (still sanitized/compacted)
      typeText = compactTypeText(m, m.getType());
      if (typeText === "__type") typeText = "object";
    }
    // keep it short if it exploded
    if (typeText.length > MAX_TYPE_LEN) typeText = "complex type";
    props.push({ name, optional, typeText });
  }
  return props;
}

/** Strip Markdown code fences from @example text and tidy up. */
function stripCodeFences(s: string): string {
  if (!s) return s;
  // Replace triple-fenced blocks (```ts\n...\n```), any language
  s = s.replace(/```(?:[a-zA-Z0-9_-]+)?\r?\n([\s\S]*?)\r?\n```/g, "$1");
  // Remove any stray triple backticks that slipped through
  s = s.replace(/```/g, "");
  // Trim leading/trailing blank lines
  s = s.replace(/^\s+|\s+$/g, "");
  return s;
}

// Is this a `export type { ... }` re-export?
function isTypeOnlyReexport(d: ExportDeclaration) {
  return d.isTypeOnly?.() === true;
}

function specNames(s: ExportSpecifier) {
  // original symbol name in the file
  const original = s.getName();
  // exported/aliased name (after `as`), or same as original
  const alias = s.getAliasNode()?.getText() ?? original;
  return { original, alias };
}

function consolidateOrCreateDocOnExport(d: ExportDeclaration, summary: string) {
  if (!DO_EDIT) return;
  const canAdd = typeof (d as any).addJsDoc === "function";
  if (!canAdd) return; // <-- gracefully skip for ExportDeclaration

  const docs = (d as any).getJsDocs?.() as JSDoc[] | undefined;
  if (!docs || docs.length === 0) {
    (d as any).addJsDoc({ description: summary });
    bumpFix();
    return;
  }
  const nonHeader = docs.filter((dd) => !isFileHeaderDoc(dd));
  if (nonHeader.length === 0) {
    (d as any).addJsDoc({ description: summary });
    bumpFix();
    return;
  }
  const primary = nonHeader[0];
  const hasSummary = /\S/.test(normalizeJsDocComment(primary.getComment()));
  if (!hasSummary) {
    const tags = primary.getTags().map((t) => ({ tagName: t.getTagName(), text: tagText(t) }));
    primary.remove();
    (d as any).addJsDoc({ description: summary, tags });
    bumpFix();
  }
}

/** Normalize all @example tags within a given JSDoc node. */
function normalizeExampleTags(doc?: JSDoc) {
  if (!doc) return;
  const examples = doc.getTags().filter((t) => t.getTagName() === "example");
  for (const tag of examples) {
    const current = tagText(tag);
    const normalized = stripCodeFences(current);
    if (normalized !== current) {
      // Recreate to avoid setText API differences across ts-morph versions
      const parent = tag.getParent();
      tag.remove();
      (parent as JSDoc).addTag({ tagName: "example", text: normalized });
      bumpFix();
    }
  }
}

function hasNonEmptySummary(doc: JSDoc): boolean {
  const s = normalizeJsDocComment(doc.getComment());
  return /\S/.test(s);
}

function collectTagTexts(doc: JSDoc, name: string): string[] {
  return doc
    .getTags()
    .filter((t) => t.getTagName() === name)
    .map((t) => tagText(t).trim())
    .filter(Boolean);
}

/** Add tag if not present with identical text (order-preserving). */
function ensureTagOnce(doc: JSDoc, tagName: string, text: string) {
  const exists = doc
    .getTags()
    .some((t) => t.getTagName() === tagName && tagText(t).trim() === text.trim());
  if (!exists) doc.addTag({ tagName, text });
}

/**
 * Consolidate all non-header JSDoc blocks on a host into ONE primary doc.
 * - Prefer a doc with non-empty summary; else the first non-header doc; else create one.
 * - Merge tags from all other non-header docs (dedup by exact text).
 * - Optionally ensure summary (fallback) if empty after merge.
 * - Remove all other non-header docs.
 * Returns the primary doc.
 */
function consolidateJsDocs(host: Node, fallbackSummary?: string): JSDoc {
  const all = ((host as any).getJsDocs?.() as JSDoc[] | undefined) ?? [];
  const nonHeader = all.filter((d) => !isFileHeaderDoc(d));

  // Choose primary
  let primary = nonHeader.find(hasNonEmptySummary) ?? nonHeader[0];

  // Create if none
  if (!primary) {
    primary = (host as any).addJsDoc({ description: fallbackSummary || " " });
  }

  // Merge tags from others into primary
  for (const d of nonHeader) {
    if (d === primary) continue;
    const tags = d.getTags();
    for (const t of tags) {
      ensureTagOnce(primary, t.getTagName(), tagText(t));
    }
  }

  // If primary has empty summary, rebuild it with fallback (preserving merged tags)
  if (!hasNonEmptySummary(primary) && fallbackSummary) {
    const merged = primary.getTags().map((t) => ({ tagName: t.getTagName(), text: tagText(t) }));
    primary.remove();
    primary = (host as any).addJsDoc({ description: fallbackSummary, tags: merged });
  }

  // Remove the extra non-header docs
  for (const d of nonHeader) {
    if (d !== primary) d.remove();
  }

  return primary;
}

/** Normalize JsDoc#getComment() (string | JSDocNode[] | undefined) to string. */
function normalizeJsDocComment(c: ReturnType<JSDoc["getComment"]>): string {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((part: any) => part?.getText?.() ?? "").join("");
  return "";
}
/** Safe text from a tag (string across ts-morph versions). */
function tagText(tag: JSDocTag): string {
  const c = (tag as any).getComment?.();
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p: any) => p?.getText?.() ?? "").join("");
  return tag.getText?.() ?? "";
}

/** JSDoc attached to this node (do NOT fall back to parent/SourceFile). */
function jsDocOfSelf(node: Node): JSDoc | undefined {
  const asSelf = (node as any).getJsDocs?.() as JSDoc[] | undefined;
  return asSelf?.[0];
}

/** Heuristic: does this JSDoc look like our top-of-file header? */
function isFileHeaderDoc(doc: JSDoc): boolean {
  const tags = doc.getTags().map((t) => t.getTagName());
  if (tags.includes("file") || tags.includes("module")) return true;
  const txt = normalizeJsDocComment(doc.getComment()).toLowerCase();
  return /@file|@module/.test(txt);
}

/** Is this string obviously noisy for docs? */
function looksNoisyType(s: string): boolean {
  if (!s) return false;
  if (s.length > 200) return true;
  if (s.includes("{")) return true; // inline object literal
  if (/\bzod\./i.test(s)) return true; // zod internals
  if (/import\("/.test(s)) return true; // import(...) paths
  return false;
}

/** Prefer the declared alias node text; if that’s noisy, use a short fallback. */
function preferredAliasDocText(node: TypeAliasDeclaration, shortFallback: string): string {
  const tn = node.getTypeNode();
  if (!tn) return shortFallback;
  const raw = sanitizeTypeTextForDocs(tn.getText());
  if (looksNoisyType(raw)) return shortFallback;
  return raw;
}

/** Host for function docs: FunctionDeclaration itself, or the VariableStatement for an arrow fn const. */
function getFunctionDocHost(node: FunctionDeclaration | ArrowFunction): Node {
  if (Node.isFunctionDeclaration(node)) return node;
  let cur: Node | undefined = node;
  while (cur && !Node.isVariableStatement(cur)) cur = cur.getParent();
  return cur ?? node;
}

/** Host for const docs: the VariableStatement containing the declaration. */
function getVarStatementHost(decl: VariableDeclaration): Node {
  let cur: Node | undefined = decl;
  while (cur && !Node.isVariableStatement(cur)) cur = cur.getParent();
  return cur ?? decl.getParentOrThrow();
}

function sanitizeTypeTextForDocs(s: string): string {
  // Collapse import("…/node_modules/pkg/index").Foo -> pkg.Foo
  s = s.replace(/import\(".*?node_modules\/([^/"]+)\/index"\)\./g, (_, pkg) => `${pkg}.`);
  // Remove absolute file paths inside import("…")
  s = s.replace(/import\(".*?"\)\./g, "");
  // Collapse excessive whitespace
  s = s.replace(/\s+/g, " ");
  // Avoid the internal __object marker
  s = s.replace(/\b__object\b/g, "object");
  // Avoid the internal __type marker
  s = s.replace(/\b__type\b/g, "object");
  return s.trim();
}

/** Prefer the declared type node text for documenting an alias (avoids huge expansions). */
function declaredAliasTextOr(node: TypeAliasDeclaration, fallback: string): string {
  const tn = node.getTypeNode();
  if (!tn) return fallback;
  return sanitizeTypeTextForDocs(tn.getText());
}

/**
 * Ensure a **non-header** JSDoc exists on `host` with a non-empty description.
 * - If no JSDoc: add one.
 * - If existing JSDoc is a header: add a second block (leave header alone).
 * - If existing non-header JSDoc has empty comment: rebuild that block only.
 * Returns the non-header JSDoc to use for adding tags.
 */
function ensureDocWithSummary(host: Node, fallback: string): JSDoc | undefined {
  if (!DO_EDIT) return jsDocOfSelf(host); // check-only: do not mutate
  const existing = jsDocOfSelf(host);
  if (!existing) {
    const doc = (host as any).addJsDoc({ description: fallback });
    bumpFix();
    return doc;
  }
  if (isFileHeaderDoc(existing)) {
    const doc = (host as any).addJsDoc({ description: fallback });
    bumpFix();
    return doc;
  }
  const curr = normalizeJsDocComment(existing.getComment());
  if (/\S/.test(curr)) return existing;

  const tags = existing.getTags().map((t) => ({ tagName: t.getTagName(), text: tagText(t) }));
  existing.remove();
  const rebuilt = (host as any).addJsDoc({ description: fallback, tags });
  bumpFix();
  return rebuilt;
}

// ---------- Type helpers (array/tuple & compacting) ----------
function isArrayLike(node: Node, t: Type) {
  if (t.isArray()) return true;
  const raw = t.getText(node).trim();
  if (/^(readonly\s*)?\[.*\]$/.test(raw)) return true; // tuple-like: [A, B] or readonly [A,B]
  if (/^ReadonlyArray<.*>$/.test(raw)) return true;
  // Try the apparent type as well (helps for `typeof CONST` cases)
  const app = t.getApparentType().getText(node).trim();
  if (/^ReadonlyArray<.*>$/.test(app) || /^Array<.*>$/.test(app) || /\[\]$/.test(app)) return true;
  return false;
}

function tupleElementTypes(node: Node, t: Type): Type[] {
  const anyT = t as any;
  if (typeof anyT.getTupleElements === "function") {
    return anyT.getTupleElements() as Type[];
  }
  return [];
}

/** Best-effort extraction of element type string from raw/apparent text. */
function elementTypeStringFromText(raw: string): string | undefined {
  const m1 = raw.match(/^ReadonlyArray<(.+)>$/);
  if (m1) return m1[1].trim();
  const m2 = raw.match(/^Array<(.+)>$/);
  if (m2) return m2[1].trim();
  if (/\[\]$/.test(raw)) return raw.replace(/\[\]$/, "").trim();
  return undefined;
}

function elementTypeDescription(node: Node, t: Type): string {
  // 1) Native array
  if (t.isArray()) {
    const et = t.getArrayElementType();
    if (et) {
      // If the element has a symbol (e.g., QueryPrimitive), prefer a readable expansion
      const aliasTxt = sanitizeTypeTextForDocs(et.getText(node));
      if (aliasTxt && !looksNoisyType(aliasTxt)) {
        // collapse true|false -> boolean inside the alias text
        const parts = aliasTxt.split("|").map((p) => p.trim());
        const collapsed =
          parts.includes("true") && parts.includes("false")
            ? ["boolean", ...parts.filter((p) => p !== "true" && p !== "false")]
            : parts;
        const uniq = Array.from(new Set(collapsed)).join(" | ");
        return uniq;
      }
      const sym = et.getSymbol()?.getName();
      if (sym && sym !== "__type") return sym; // fallback to the alias name
      const s = compactTypeText(node, et);
      if (s === "object" || s === "__object" || looksNoisyType(s)) return "unknown";
      return s;
    }
  }

  // 2) Tuple
  const elems = tupleElementTypes(node, t);
  if (elems.length) {
    const names = elems
      .map((e) => {
        const sym = e.getSymbol()?.getName();
        return sym && sym !== "__type" ? sym : compactTypeText(node, e);
      })
      .filter((s) => s && s !== "object" && s !== "__object" && !looksNoisyType(s));
    const uniq = Array.from(new Set(names));
    if (uniq.length === 0) return "unknown";
    return uniq.join(" | ");
  }

  // 3) Pattern extraction from raw/apparent (last resort)
  const raw = t.getText(node).trim();
  const app = t.getApparentType().getText(node).trim();
  const from = elementTypeStringFromText(raw) ?? elementTypeStringFromText(app);
  if (!from) return "unknown";
  if (from === "object" || from === "__object" || looksNoisyType(from)) return "unknown";
  return from.replace(/\s+/g, " ");
}

// Type compaction heuristics
function compactTypeText(node: Node, t = node.getType()): string {
  let raw = t.getText(node).trim();
  if (!raw) return "unknown";

  const symName = t.getSymbol()?.getName();
  if (symName && symName !== "__type") return symName;

  if (isTupleType(t)) {
    const rawTxt = t.getText(node).trim();
    const appTxt = t.getApparentType().getText(node).trim();
    const ro = /^readonly\b/.test(rawTxt) || /^readonly\b/.test(appTxt);

    // Render each element compactly
    const elems = tupleElementTypes(node, t);
    const parts = elems.map((e) => {
      const sym = e.getSymbol()?.getName();
      const token = sym && sym !== "__type" ? sym : compactTypeText(node, e);
      return sanitizeTypeTextForDocs(token);
    });

    // If tuple is large or elements look noisy/object-like, collapse to Array form
    const tooMany = parts.length > 5;
    const looksNoisy = parts.some((p) => p === "object" || p === "__object" || looksNoisyType(p));
    if (tooMany || looksNoisy) {
      // Try to infer a sane element description; fall back to `object`.
      const guess = elementTypeDescription(node, t);
      const el = !guess || guess === "unknown" ? "object" : guess;
      const ctor = ro ? "ReadonlyArray" : "Array";
      return `${ctor}<${el}>`;
    }

    const inner = parts.join(", ");
    return `${ro ? "readonly " : ""}[${inner}]`;
  }

  if (isArrayLike(node, t)) {
    // Don’t explode to huge literal types.
    // Prefer a clean ctor and only show elements if they look sane.
    const el = elementTypeDescription(node, t);
    const appTxt = sanitizeTypeTextForDocs(t.getApparentType().getText(node).trim());
    const rawTxt = sanitizeTypeTextForDocs(t.getText(node).trim());
    const ro = /^ReadonlyArray<.*>$/.test(appTxt) || /^readonly\b/.test(rawTxt);
    const ctor = ro ? "ReadonlyArray" : "Array";
    if (el !== "unknown") return `${ctor}<${el}>`;
    // If element is unknown or noisy, fallback to generic array form
    return `${ctor}<unknown>`;
  }

  if (
    raw.length <= MAX_TYPE_LEN &&
    !/(\bPick<|\bOmit<|\bPartial<|\bRecord<|\bRequired<|\bReadonly<| extends | infer | \?| : )/.test(
      raw,
    )
  ) {
    return sanitizeTypeTextForDocs(raw);
  }

  if (t.isUnion()) {
    let parts = t.getUnionTypes().map((u) => {
      const n = u.getSymbol()?.getName();
      return n && n !== "__type" ? n : compactTypeText(node, u);
    });
    // collapse true|false → boolean
    const set = new Set(parts);
    if (set.has("true") && set.has("false")) {
      parts = parts.filter((p) => p !== "true" && p !== "false");
      parts.unshift("boolean");
    }
    const uniq = Array.from(
      new Set(parts.map((p) => (p === "__object" || p === "__type" ? "object" : p))),
    );
    const ordered = sortPrimitiveUnion(uniq);
    const joined = ordered.join(" | ");
    return normalizeInlineUnionText(joined).length <= MAX_TYPE_LEN
      ? normalizeInlineUnionText(joined)
      : `union(${uniq.length})`;
  }

  if (t.isIntersection()) {
    const parts = t.getIntersectionTypes().map((u) => compactTypeText(node, u));
    const uniq = Array.from(new Set(parts));
    const joined = uniq.join(" & ");
    return joined.length <= MAX_TYPE_LEN ? joined : `intersection(${uniq.length})`;
  }
  if (t.isObject() && t.getSymbol()?.getName() && !t.isAnonymous()) {
    return t.getSymbol()!.getName();
  }
  if (raw.startsWith("{") && raw.endsWith("}")) return "object";
  if (/^Promise<.*>$/.test(raw)) return sanitizeTypeTextForDocs(raw);

  return "object";
}

function getParams(node: FunctionDeclaration | ArrowFunction) {
  return node.getParameters().map((p) => {
    const name = p.getName();
    const isRest = p.isRestParameter();
    const hasQ = p.hasQuestionToken();
    const init = p.getInitializer();
    const isOptional = hasQ || !!init || isRest; // treat rest as optional for docs
    const typeText = compactTypeText(p);
    const displayName = isRest ? `...${name}` : name;
    const defaultText = init ? init.getText().trim() : undefined;
    return { name: displayName, isOptional, defaultText, typeText };
  });
}

/** Ensure a single tag with given name & text (remove & re-add if needed; avoids setText API differences). */
function addOrEnsureTag(doc: JSDoc | undefined, tagName: string, text: string) {
  if (!DO_EDIT || !doc) return;
  const existing = doc.getTags().find((t) => t.getTagName() === tagName);
  if (!existing) {
    doc.addTag({ tagName, text });
    return;
  }
  if (tagText(existing).trim() === text.trim()) return;
  existing.remove();
  doc.addTag({ tagName, text });
}

/** Replace all @param tags with the provided ordered lines. */
function replaceParamTags(doc: JSDoc | undefined, lines: string[]) {
  if (!DO_EDIT || !doc) return;
  doc
    .getTags()
    .filter((t) => t.getTagName() === "param")
    .forEach((t) => t.remove());
  lines.forEach((l) => doc.addTag({ tagName: "param", text: l }));
}

/** Replace all @property tags with the provided ordered lines. */
function replacePropertyTags(doc: JSDoc | undefined, lines: string[]) {
  if (!DO_EDIT || !doc) return;
  doc
    .getTags()
    .filter((t) => t.getTagName() === "property")
    .forEach((t) => t.remove());
  lines.forEach((l) => doc.addTag({ tagName: "property", text: l }));
}

// ----------------- collectors -----------------
function collectExported(sf: SourceFile) {
  const fns: Array<{ node: FunctionDeclaration | ArrowFunction; name: string }> = [];
  const consts: Array<{
    node: VariableDeclaration;
    name: string;
    isFunctionConst: boolean;
    arrow?: ArrowFunction;
  }> = [];
  const types: TypeAliasDeclaration[] = [];
  const ifaces: InterfaceDeclaration[] = [];
  const enums: EnumDeclaration[] = [];

  // Functions (named + default)
  sf.getFunctions().forEach((fn) => {
    if (fn.isExported()) fns.push({ node: fn, name: fn.getName() ?? "default" });
  });
  const def = sf.getDefaultExportSymbol();
  if (def) {
    def.getDeclarations().forEach((d) => {
      if (Node.isFunctionDeclaration(d)) fns.push({ node: d, name: d.getName() ?? "default" });
    });
  }

  // Exported consts (may be arrow functions)
  sf.getVariableStatements().forEach((vs) => {
    if (!vs.isExported()) return;
    vs.getDeclarations().forEach((vd) => {
      const init = vd.getInitializer();
      const arrow = init && Node.isArrowFunction(init) ? init : undefined;
      consts.push({ node: vd, name: vd.getName(), isFunctionConst: !!arrow, arrow });
    });
  });

  // Types / interfaces / enums
  sf.getTypeAliases().forEach((t) => {
    if (t.isExported()) types.push(t);
  });
  sf.getInterfaces().forEach((i) => {
    if (i.isExported()) ifaces.push(i);
  });
  sf.getEnums().forEach((e) => {
    if (e.isExported()) enums.push(e);
  });

  return { fns, consts, types, ifaces, enums };
}

// ----------------- fixers -----------------
function ensureFunctionDoc(
  sf: SourceFile,
  node: FunctionDeclaration | ArrowFunction,
  name: string,
) {
  const host = getFunctionDocHost(node);
  const needsDoc = (() => {
    const d = jsDocOfSelf(host);
    if (!d) return true;
    if (isFileHeaderDoc(d)) return true;
    const hasSummary = /\S/.test(normalizeJsDocComment(d.getComment()));
    const hasParams = d.getTags().some((t) => t.getTagName() === "param");
    const hasReturns = d.getTags().some((t) => t.getTagName().startsWith("return"));
    return !(hasSummary && hasParams && hasReturns);
  })();

  if (!DO_EDIT) {
    if (needsDoc) recordViolation(sf, "function", name, "missing/insufficient JSDoc");
    return;
  }

  const doc = consolidateJsDocs(host, `Function ${name}.`);

  const params = getParams(node);
  const paramLines = params.map((p) => {
    const reqOpt = p.isOptional ? "optional" : "required";
    const def = p.defaultText ? ` [default=${p.defaultText}]` : "";
    const tshort = capDocType((p.typeText || "unknown").replace(/\b__type\b/g, "object"));
    return `${p.name} (${reqOpt}: ${tshort})${def}`;
  });
  replaceParamTags(doc, paramLines);

  const rType = compactTypeText(node, node.getReturnType());
  addOrEnsureTag(doc, "returns", capDocType(rType.replace(/\b__type\b/g, "object")));

  normalizeExampleTags(doc);
  bumpFix();
}

function ensureConstDoc(sf: SourceFile, decl: VariableDeclaration, name: string) {
  const init = decl.getInitializer();
  const arrow = init && Node.isArrowFunction(init) ? init : undefined;
  if (arrow) return ensureFunctionDoc(sf, arrow, name);

  const host = getVarStatementHost(decl);
  if (!DO_EDIT) {
    const d = jsDocOfSelf(host);
    const needs = !d || isFileHeaderDoc(d) || !/\S/.test(normalizeJsDocComment(d.getComment()));
    if (needs) recordViolation(sf, "const", name, "missing/insufficient JSDoc");
    return;
  }

  const doc = consolidateJsDocs(host, `Constant ${name}.`);
  let typeText = compactTypeText(decl, decl.getType()).replace(/\b__type\b/g, "object");

  // If we fell back to plain "object", try the declared type annotation text
  if (typeText === "object") {
    const tn = decl.getTypeNode?.();
    const aliasTxt = tn ? sanitizeTypeTextForDocs(tn.getText()) : "";
    if (aliasTxt && !looksNoisyType(aliasTxt) && aliasTxt.length <= MAX_TYPE_LEN) {
      typeText = aliasTxt;
    }
  }

  addOrEnsureTag(
    doc,
    "remarks",
    `Type: ${typeText.length <= MAX_TYPE_LEN ? typeText : "complex object; see source"}`,
  );

  bumpFix();
}

function ensureTypeAliasDoc(sf: SourceFile, t: TypeAliasDeclaration) {
  const name = t.getName();

  if (!DO_EDIT) {
    const d = jsDocOfSelf(t);
    const needs = !d || isFileHeaderDoc(d) || !/\S/.test(normalizeJsDocComment(d.getComment()));
    if (needs) recordViolation(sf, "type", name, "missing/insufficient JSDoc");
    return;
  }
  // Is the alias text a conditional helper like `T extends X ? Y : Z`
  function looksConditionalAliasText(s: string): boolean {
    return /\bextends\b[^?]*\?[^:]*:/.test(s);
  }

  // Single doc per node (merge any pre-existing blocks)
  const doc = consolidateJsDocs(t, `Type alias ${name}.`);

  const tt = t.getType();
  const aliasTextRaw = t.getTypeNode()?.getText() ?? "";
  const aliasTextClean = sanitizeTypeTextForDocs(aliasTextRaw);
  const isConditionalAlias = looksConditionalAliasText(aliasTextClean);
  const isTypeofAlias = /^\s*typeof\s+/.test(aliasTextClean);
  const templateBody = (s: string): string | null => {
    const m = s.match(/`([^`]+)`/);
    return m ? m[1] : null;
  };

  // 1) Array/tuple-like: don't enumerate properties; give concise collection description
  if (isArrayLike(t, tt)) {
    // If the alias is literally "typeof GEN" etc., keep it as-is for clarity.
    if (isTypeofAlias) {
      const pretty = compactTypeText(t, tt);
      addOrEnsureTag(doc, "remarks", `Type: ${pretty}`);
      normalizeExampleTags(doc);
      bumpFix();
      return;
    }

    // Otherwise show Array<NamedElement> or Array<unknown>; no "Elements:" if unknown.
    const pretty = compactTypeText(t, tt); // Array<...> or ReadonlyArray<...>
    addOrEnsureTag(doc, "remarks", `Type: ${pretty}`);
    normalizeExampleTags(doc);
    bumpFix();
    return;
  }

  // 2) Object-like with user-defined fields only
  const isObjectLike = tt.isObject() && !tt.isArray() && !isTupleType(tt);
  if (isObjectLike) {
    // 2a) Try declared literal (best for preserving names & avoiding __type)
    const lit = declaredTypeLiteral(t);
    if (lit) {
      const decProps = readDeclaredPropsFromLiteral(lit);
      if (decProps.length > 0) {
        const lines = decProps.map(
          (p) => `${p.name} (${p.optional ? "optional" : "required"}: ${p.typeText}).`,
        );
        replacePropertyTags(doc, lines);
        normalizeExampleTags(doc);
        bumpFix();
        return;
      }
    }

    // 2b) Fallback: use checker properties (still sanitize and avoid __type)
    const props = tt.getProperties();
    const lines: string[] = [];
    for (const p of props) {
      const decls = p.getDeclarations();
      const decl = decls?.find(
        (d) => Node.isPropertySignature(d) || (Node as any).isPropertyDeclaration?.(d),
      );
      if (!decl) continue;

      const isOptional =
        Node.isPropertySignature(decl) || (Node as any).isPropertyDeclaration?.(decl)
          ? ((decl as any).hasQuestionToken?.() ?? false)
          : false;

      const declaredNode = (decl as any).getTypeNode?.();
      let typeText: string | undefined = declaredNode
        ? sanitizeTypeTextForDocs(declaredNode.getText())
        : undefined;

      if (!typeText || /\b__type\b/.test(typeText)) {
        const propType = p.getTypeAtLocation(decl as Node);
        typeText = compactTypeText(decl as Node, propType);
        if (typeText === "__type") typeText = "object";
      }

      if (typeText.length > MAX_TYPE_LEN) typeText = "complex type";

      lines.push(
        `${p.getName()} (${isOptional ? "optional" : "required"}: ${capDocType(typeText)})`,
      );
    }

    if (lines.length > 0) {
      replacePropertyTags(doc, lines);
    } else {
      if (isConditionalAlias) {
        const tmpl = templateBody(aliasTextClean);
        if (tmpl) addOrEnsureTag(doc, "remarks", `Type: \`${tmpl}\``);
      } else {
        addOrEnsureTag(doc, "remarks", `Type: ${sanitizeTypeTextForDocs(compactTypeText(t, tt))}`);
      }
    }

    normalizeExampleTags(doc);
    bumpFix();
    return;
  }

  // 3) Unions / intersections / everything else
  if (tt.isUnion()) {
    let partsRaw = tt.getUnionTypes().map((u) => compactTypeText(t, u));
    partsRaw = partsRaw.map((p) => (p === "__object" ? "object" : p));
    const parts = Array.from(new Set(collapseBooleanParts(partsRaw)));
    const allObjects = parts.length > 0 && parts.every((p) => p === "object");
    const tooMany = parts.length > 8;
    const noisyParts = parts.some(looksNoisyType);

    if (allObjects || tooMany || noisyParts) {
      const pref = preferredAliasDocText(t, sanitizeTypeTextForDocs(t.getName()));
      addOrEnsureTag(doc, "remarks", `Type: ${pref}`);
    } else {
      const simpleAll = parts.every(isSimpleAtom);
      if (simpleAll && parts.length <= 6) {
        const ordered = sortPrimitiveUnion(parts);
        addOrEnsureTag(doc, "remarks", `Type: ${ordered.join(" | ")}`);
      } else {
        addOrEnsureTag(doc, "remarks", `Variants:\n- ${parts.join("\n- ")}`);
      }
    }
    normalizeExampleTags(doc);
  } else if (tt.isIntersection()) {
    const parts = tt.getIntersectionTypes().map((u) => compactTypeText(t, u));
    const simpleAll = parts.every(isSimpleAtom);
    if (simpleAll && parts.length <= 4) {
      addOrEnsureTag(doc, "remarks", `Type: ${parts.join(" & ")}`);
    } else {
      const pref = preferredAliasDocText(t, sanitizeTypeTextForDocs(t.getName()));
      addOrEnsureTag(doc, "remarks", `Type: ${pref}`);
    }
    normalizeExampleTags(doc);
  } else {
    // Simple/non-composite
    if (isConditionalAlias) {
      const tmpl = templateBody(aliasTextClean);
      if (tmpl) {
        addOrEnsureTag(doc, "remarks", `Type: \`${tmpl}\``);
        normalizeExampleTags(doc);
      } else {
        const ct = sanitizeTypeTextForDocs(compactTypeText(t, tt));
        if (ct && ct !== "object") {
          addOrEnsureTag(doc, "remarks", `Type: ${ct}`);
          normalizeExampleTags(doc);
        }
        // else: skip noisy/meaningless remark
      }
    } else if (aliasTextClean && !looksNoisyType(aliasTextClean)) {
      addOrEnsureTag(doc, "remarks", `Type: ${normalizeInlineUnionText(aliasTextClean)}`);
      normalizeExampleTags(doc);
    } else {
      const pref = normalizeInlineUnionText(
        preferredAliasDocText(t, sanitizeTypeTextForDocs(t.getName())),
      );
      addOrEnsureTag(doc, "remarks", `Type: ${pref}`);
      normalizeExampleTags(doc);
    }
  }
  bumpFix();
  return;
}

function ensureInterfaceDoc(sf: SourceFile, i: InterfaceDeclaration) {
  const name = i.getName();
  const needsDoc = (() => {
    const d = jsDocOfSelf(i);
    if (!d) return true;
    if (isFileHeaderDoc(d)) return true;
    return /\S/.test(normalizeJsDocComment(d.getComment())) === false;
  })();

  if (!DO_EDIT) {
    if (needsDoc) recordViolation(sf, "interface", name, "missing/insufficient JSDoc");
    return;
  }

  const doc = ensureDocWithSummary(i, `Interface ${name}.`);

  const lines: string[] = [];
  i.getProperties().forEach((p) => {
    const opt = p.hasQuestionToken();
    const compact = compactTypeText(p, p.getType());
    const reqOpt = opt ? "optional" : "required";
    lines.push(`${p.getName()} (${reqOpt}: ${capDocType(compact)})`);
  });
  replacePropertyTags(doc, lines);
  bumpFix();
}

function ensureEnumDoc(sf: SourceFile, e: EnumDeclaration) {
  const name = e.getName();
  const needsDoc = (() => {
    const d = jsDocOfSelf(e);
    if (!d) return true;
    if (isFileHeaderDoc(d)) return true;
    return /\S/.test(normalizeJsDocComment(d.getComment())) === false;
  })();

  if (!DO_EDIT) {
    if (needsDoc) recordViolation(sf, "enum", name, "missing/insufficient JSDoc");
    return;
  }

  const doc = ensureDocWithSummary(e, `Enum ${name}.`);

  const items = e.getMembers().map((m) => m.getName());
  addOrEnsureTag(doc, "remarks", `Members:\n- ${items.join("\n- ")}`);
  bumpFix();
}

// ----------------- main -----------------
const project = new Project({
  tsConfigFilePath: path.join(ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

// capture BEFORE text for dry-run report
const beforeText: Record<string, string> = {};

for (const sf of project.getSourceFiles(["src/**/*.ts"])) {
  const abs = sf.getFilePath();
  if (isIgnoredFile(abs)) continue;
  if (isSchemaFile(abs)) continue; // schema files: header-only (handled elsewhere)

  beforeText[abs] = sf.getFullText();

  const { fns, consts, types, ifaces, enums } = collectExported(sf);

  // Functions
  for (const f of fns) ensureFunctionDoc(sf, f.node, f.name);

  // Consts (non-function)
  for (const c of consts) ensureConstDoc(sf, c.node, c.name);

  // Types / Interfaces / Enums
  for (const t of types) ensureTypeAliasDoc(sf, t);
  for (const i of ifaces) ensureInterfaceDoc(sf, i);
  for (const e of enums) ensureEnumDoc(sf, e);

  // --- Re-exported type aliases: `export type { A as B }` ---
  for (const ed of sf.getExportDeclarations()) {
    if (!isTypeOnlyReexport(ed)) continue;

    const from = ed.getModuleSpecifierValue?.();
    // We only *fix* docs for local re-exports (no module specifier).
    // For external (with `from`), we just annotate the export line.
    const local = !from;

    const specs = ed.getNamedExports();
    if (specs.length === 0) continue;

    // 2a) Ensure the *source* declarations have docs (local only)
    if (local) {
      for (const s of specs) {
        const { original, alias } = specNames(s);
        // Resolve the local symbol and its declaration
        const sym = s.getSymbol();
        const aliased = sym?.getAliasedSymbol?.();
        const decls = (aliased ?? sym)?.getDeclarations?.() ?? [];

        // Find a type alias / interface / enum we can annotate
        const targetDecl = decls.find(
          (d) =>
            Node.isTypeAliasDeclaration(d) ||
            Node.isInterfaceDeclaration(d) ||
            Node.isEnumDeclaration(d),
        ) as TypeAliasDeclaration | InterfaceDeclaration | EnumDeclaration | undefined;

        if (!targetDecl) {
          // Nothing to fix; but we can still annotate the export declaration below
          continue;
        }

        // Ensure that declaration has a proper doc (reuse our existing fixers)
        if (Node.isTypeAliasDeclaration(targetDecl)) {
          ensureTypeAliasDoc(sf, targetDecl);
        } else if (Node.isInterfaceDeclaration(targetDecl)) {
          ensureInterfaceDoc(sf, targetDecl);
        } else if (Node.isEnumDeclaration(targetDecl)) {
          ensureEnumDoc(sf, targetDecl);
        }
      }
    }

    // 2b) Optionally add a concise doc to the export line itself (local or external)
    // This doesn’t attach to a symbol, but helps readers in-file and is harmless.
    const aliasPairs = specs.map((s) => {
      const { original, alias } = specNames(s);
      return alias === original ? `\`${alias}\`` : `\`${alias}\` (alias of \`${original}\`)`;
    });

    const summaryBase = from
      ? `Re-exported types from ${from}.`
      : `Re-exported types (local aliases).`;

    const summary = `${summaryBase}\n${aliasPairs.map((a) => `- ${a}`).join("\n")}`;

    consolidateOrCreateDocOnExport(ed, summary);
  }

  // If dry-run, collect after text for changed files
  if (DRY) {
    const after = sf.getFullText();
    if (after !== beforeText[abs]) {
      report.push({ file: rel(abs), before: beforeText[abs], after });
    }
  }
}

// ---- finalize ----
if (DRY) {
  const lines: string[] = [];
  lines.push(`# JSDoc Exports — Dry Run Report`);
  lines.push(`Mode: DRY RUN (no files written)`);
  lines.push(`Files changed: ${report.length}`);
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push("");
  for (const { file, before, after } of report) {
    lines.push(`===== FILE: ${file} =====`);
    lines.push(`--- BEFORE ---`);
    lines.push(before);
    lines.push(`--- AFTER ----`);
    lines.push(after);
    lines.push(""); // spacer
  }
  fs.writeFileSync(OUT_PATH, lines.join("\n"), "utf8");
  console.log(`Dry run complete. Proposed changes in: ${OUT_PATH}`);
  process.exit(0);
}

if (WRITE) {
  (project as any).saveSync?.();
  console.log(`Export JsDoc fix complete. Files updated: ${fixed}`);
  process.exit(0);
}

// Check-only mode: fail if violations exist
if (violations.length) {
  console.error("Export JsDoc check failed:");
  violations.forEach((v) => console.error(` - ${v.file} :: ${v.kind} ${v.name}: ${v.reason}`));
  process.exit(1);
}
console.log("Export JsDoc check passed.");
