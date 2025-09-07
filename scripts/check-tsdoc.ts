// scripts/check-tsdoc.ts
import {
  Project,
  Node,
  JSDoc,
  JSDocTag,
  FunctionDeclaration,
  ArrowFunction,
  VariableDeclaration,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
  SourceFile,
  Type,
} from "ts-morph";
import * as path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SCHEMAS = path.join(SRC, "schemas");
const IGNORE = new Set<string>([path.join(SRC, "registry", "generated.ts")]);

const MAX_TYPE_LEN = 120;
const MAX_REMARKS_LEN = 300;
const MAX_RETURNS_LEN = 200;

const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");
const isUnder = (dir: string, file: string) => {
  const r = path.relative(dir, file);
  return !!r && !r.startsWith("..") && !path.isAbsolute(r);
};
const isSchemaFile = (abs: string) => isUnder(SCHEMAS, abs);
const isIgnored = (abs: string) => {
  if (IGNORE.has(abs)) return true;
  const r = rel(abs);
  if (/\b(__tests__|__fixtures__|__mocks__)\b/.test(r)) return true;
  if (/(\.spec|\.test)\.ts$/.test(r)) return true;
  return false;
};

// ---- Helpers ---------------------------------------------------------------

function jsDocOfSelf(node: Node): JSDoc | undefined {
  const asSelf = (node as any).getJsDocs?.() as JSDoc[] | undefined;
  return asSelf?.[0];
}
function isHeaderDoc(doc: JSDoc): boolean {
  const names = doc.getTags().map((t) => t.getTagName());
  if (names.includes("file") || names.includes("module")) return true;
  const txt = normalizeComment(doc.getComment()).toLowerCase();
  return /@file|@module/.test(txt);
}
function normalizeComment(c: ReturnType<JSDoc["getComment"]>): string {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p: any) => p?.getText?.() ?? "").join("");
  return "";
}
function tagText(tag: JSDocTag): string {
  const c = (tag as any).getComment?.();
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p: any) => p?.getText?.() ?? "").join("");
  return tag.getText?.() ?? "";
}
function compactType(node: Node, t: Type = node.getType()): string {
  // Keep this light: we only validate obvious anti-patterns and length.
  let raw = t.getText(node).trim();
  // collapse some noise
  raw = raw.replace(/\s+/g, " ");
  return raw;
}
function looksNoisyType(s: string): boolean {
  if (!s) return false;
  if (s.length > MAX_TYPE_LEN) return true;
  if (s.includes("{")) return true; // inline object literal
  if (/import\("/.test(s)) return true; // import("…")
  if (/\b__type\b/.test(s)) return true; // ts internal expansion
  if (/\bZod[A-Za-z]+<.+>/.test(s)) return true; // giant zod generics
  return false;
}
function summary(doc?: JSDoc): string {
  return doc ? normalizeComment(doc.getComment()).trim() : "";
}
function nonHeaderDoc(node: Node): JSDoc | undefined {
  const docs = ((node as any).getJsDocs?.() as JSDoc[] | undefined) ?? [];
  return docs.find((d) => !isHeaderDoc(d));
}
function requireDoc(node: Node): { ok: boolean; doc?: JSDoc; reason?: string } {
  const d = nonHeaderDoc(node);
  if (!d) return { ok: false, reason: "missing JSDoc" };
  const s = summary(d);
  if (!/\S/.test(s)) return { ok: false, reason: "empty summary" };
  if (/TODO\b/i.test(s)) return { ok: false, reason: "summary contains TODO" };
  return { ok: true, doc: d };
}

// Parse “name (required|optional: Type) [default=…]”
const PARAM_LINE_RE =
  /^([.[\]A-Za-z0-9_...]+)\s+\((required|optional):\s+([^)]*?)\)\s*(?:\[default=.*\])?\.?$/;

// For @property same shape but simpler name set
const PROP_LINE_RE = /^([A-Za-z0-9_]+)\s+\((required|optional):\s+([^)]*?)\)$/;

function validateTypeSnippet(s: string): string | null {
  if (!s || !/\S/.test(s)) return "empty type";
  const norm = s.replace(/\s+/g, " ").trim();
  if (norm.length > MAX_TYPE_LEN) return `type too long (> ${MAX_TYPE_LEN})`;
  if (/\b__type\b/.test(norm)) return "contains __type (should be 'object' or alias)";
  if (/import\(".*?"\)/.test(norm)) return 'contains import("…")';
  // Allow "Variants:" blocks elsewhere; here we’re checking Type: payloads only
  // Collapse true|false unions must be boolean
  if (/\btrue\s*\|\s*false\b/i.test(norm)) return "boolean union not collapsed (use 'boolean')";
  // Treat ReadonlyArray without element as a specific warning elsewhere (we do that)
  return null;
}

function getFunctionDocHostForCheck(fn: FunctionDeclaration | ArrowFunction): Node {
  if (Node.isFunctionDeclaration(fn)) return fn;
  // climb: ArrowFunction -> VariableDeclaration -> VariableStatement
  let cur: Node | undefined = fn.getParentOrThrow();
  while (cur && !Node.isVariableStatement(cur)) cur = cur.getParent();
  return cur ?? fn;
}

function looksConditionalAliasText(t: TypeAliasDeclaration): boolean {
  const tn = t.getTypeNode();
  if (!tn) return false;
  const s = tn.getText();
  return /\bextends\b[^?]*\?[^:]*:/.test(s);
}

function squishSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function getParamNameFromTag(tag: JSDocTag): string | undefined {
  // ts-morph exposes name for JSDocParameterTag via getName() or getNameNode()
  const anyTag = tag as any;
  if (typeof anyTag.getName === "function") {
    const n = anyTag.getName();
    if (n) return n; // "arg", "...rest", or binding pattern text in some cases
  }
  if (typeof anyTag.getNameNode === "function") {
    const nn = anyTag.getNameNode();
    const t = nn?.getText?.();
    if (t) return t;
  }
  return undefined;
}

function parseParamLine(raw: string): {
  name: string;
  reqOpt: "required" | "optional";
  typeTxt: string;
  hasDefault: boolean;
} | null {
  // collapse newlines and extra spaces, trim trailing period
  const text = raw
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.\s*$/, "");
  // Extract optional trailing [default=…]
  let hasDefault = false;
  const noDefault = text
    .replace(/\s*\[default=.*?\]$/, (m) => {
      hasDefault = true;
      return "";
    })
    .trim();

  // Expect: <name> (<required|optional>: <type>)
  const open = noDefault.indexOf("(");
  const close = noDefault.lastIndexOf(")");
  if (open <= 0 || close <= open) return null;

  const name = noDefault.slice(0, open).trim();
  const inner = noDefault.slice(open + 1, close).trim();

  const colon = inner.indexOf(":");
  if (colon < 0) return null;

  const reqOptRaw = inner.slice(0, colon).trim().toLowerCase();
  const reqOpt =
    reqOptRaw === "required" ? "required" : reqOptRaw === "optional" ? "optional" : null;
  if (!reqOpt) return null;

  const typeTxt = inner.slice(colon + 1).trim();
  if (!typeTxt) return null;

  return { name, reqOpt, typeTxt, hasDefault };
}

// ---- Reporter --------------------------------------------------------------

type Violation = { file: string; line: number; kind: string; name: string; msg: string };
const problems: Violation[] = [];
const push = (sf: SourceFile, node: Node, kind: string, name: string, msg: string) => {
  problems.push({ file: rel(sf.getFilePath()), line: node.getStartLineNumber(), kind, name, msg });
};

// ---- Validation passes -----------------------------------------------------

function checkFunction(sf: SourceFile, fn: FunctionDeclaration | ArrowFunction, name: string) {
  const host = getFunctionDocHostForCheck(fn);
  const { ok, doc, reason } = requireDoc(host);
  if (!ok) return push(sf, host, "function", name, reason!);

  // @param lines
  const params = fn.getParameters();
  const tagParams = (doc!.getTags().filter((t) => t.getTagName() === "param") || []).map((t) => {
    const nameFromTag = getParamNameFromTag(t);
    const text = tagText(t) ?? "";
    // If the text already begins with a name-like token, leave it; otherwise prefix the name.
    const squished = text.replace(/\s+/g, " ").trim();
    const looksLikeHasName = /^[.[\]A-Za-z0-9_...]+ \(/.test(squished);
    return looksLikeHasName || !nameFromTag ? squished : `${nameFromTag} ${squished}`;
  });

  if (tagParams.length !== params.length) {
    push(
      sf,
      host,
      "function",
      name,
      `@param count mismatch (expected ${params.length}, got ${tagParams.length})`,
    );
  }

  params.forEach((p, idx) => {
    const tline = tagParams[idx];
    if (!tline) return;
    const line = squishSpaces(tline).replace(/\.\s*$/, "."); // collapse whitespace, normalize end
    const parsed = parseParamLine(tline);
    if (!parsed) {
      const squished = tline.replace(/\s+/g, " ").trim();
      push(sf, host, "function", name, `@param line ${idx + 1} invalid format [${squished}]`);
      return;
    }
    const { name: pname, reqOpt, typeTxt } = parsed;
    // Expected name (skip strict match for destructuring bindings)
    const expectedName = p.isRestParameter() ? `...${p.getName()}` : p.getName();
    const isDestructured = /[\{\[]/.test(expectedName); // { a, b } or [a,b]
    if (!isDestructured) {
      if (pname !== expectedName) {
        push(sf, host, "function", name, `@param ${idx + 1} name '${pname}' != '${expectedName}'`);
      }
    }
    const isOptional = p.hasQuestionToken() || !!p.getInitializer() || p.isRestParameter();
    const expectedReqOpt = isOptional ? "optional" : "required";
    if (reqOpt !== expectedReqOpt) {
      push(
        sf,
        host,
        "function",
        name,
        `@param ${pname} required/optional mismatch (got ${reqOpt}, expected ${expectedReqOpt})`,
      );
    }
    const typeErr = validateTypeSnippet(typeTxt.trim());
    if (typeErr) push(sf, host, "function", name, `@param ${pname} type: ${typeErr}`);
  });

  // @returns
  const retTag = doc!.getTags().find((t) => /^returns?$/i.test(t.getTagName()));
  const retType = fn.getReturnType();
  const needsReturns = !(retType.isVoid() || retType.getText(fn).trim() === "void");
  if (needsReturns && !retTag) {
    push(sf, host, "function", name, "missing @returns");
  } else if (retTag) {
    const text = tagText(retTag).trim();
    if (!/\S/.test(text)) push(sf, host, "function", name, "@returns empty");
    if (/TODO\b/i.test(text)) push(sf, host, "function", name, "@returns contains TODO");
    if (text.length > MAX_RETURNS_LEN)
      push(sf, host, "function", name, `@returns too long (> ${MAX_RETURNS_LEN})`);
    const typeErr = validateTypeSnippet(text);
    if (typeErr) push(sf, host, "function", name, `@returns type: ${typeErr}`);
  }
}

function checkConst(sf: SourceFile, decl: VariableDeclaration) {
  const name = decl.getName();
  // Arrow fn consts validated via function pass (we’ll still enforce doc presence here)
  const host = (() => {
    let cur: Node | undefined = decl;
    while (cur && !Node.isVariableStatement(cur)) cur = cur.getParent();
    return cur ?? decl.getParentOrThrow();
  })();

  const { ok, doc, reason } = requireDoc(host);
  if (!ok) return push(sf, host, "const", name, reason!);

  // look for a concise @remarks Type: …
  const remarks = doc!.getTags().filter((t) => t.getTagName() === "remarks");
  if (remarks.length === 0) {
    // optional, but nice to have
    return;
  }
  const r = tagText(remarks[0]).trim();
  if (/TODO\b/i.test(r)) push(sf, host, "const", name, "@remarks contains TODO");
  if (!/^Type:\s+/.test(r)) push(sf, host, "const", name, "@remarks should start with 'Type: '");
  if (r.length > MAX_REMARKS_LEN)
    push(sf, host, "const", name, `@remarks too long (> ${MAX_REMARKS_LEN})`);
  const type = r.replace(/^Type:\s+/i, "").trim();
  const typeErr = validateTypeSnippet(type);
  if (typeErr) push(sf, host, "const", name, `@remarks type: ${typeErr}`);
}

function checkInterface(sf: SourceFile, i: InterfaceDeclaration) {
  const name = i.getName();
  const { ok, doc, reason } = requireDoc(i);
  if (!ok) return push(sf, i, "interface", name, reason!);

  const props = i.getProperties();
  const propTags = (doc!.getTags().filter((t) => t.getTagName() === "property") || []).map(tagText);

  if (propTags.length !== props.length) {
    push(
      sf,
      i,
      "interface",
      name,
      `@property count mismatch (expected ${props.length}, got ${propTags.length})`,
    );
  }

  props.forEach((p, idx) => {
    const tline = propTags[idx];
    if (!tline) return;
    const m = tline.match(PROP_LINE_RE);
    if (!m) {
      push(sf, i, "interface", name, `@property line ${idx + 1} invalid format`);
      return;
    }
    const [, pname, reqOpt, typeTxt] = m;
    if (pname !== p.getName()) {
      push(sf, i, "interface", name, `@property ${idx + 1} name '${pname}' != '${p.getName()}'`);
    }
    const expected = p.hasQuestionToken() ? "optional" : "required";
    if (reqOpt !== expected) {
      push(
        sf,
        i,
        "interface",
        name,
        `@property ${pname} required/optional mismatch (got ${reqOpt}, expected ${expected})`,
      );
    }
    const typeErr = validateTypeSnippet(typeTxt.trim());
    if (typeErr) push(sf, i, "interface", name, `@property ${pname} type: ${typeErr}`);
  });
}

function checkTypeAlias(sf: SourceFile, t: TypeAliasDeclaration) {
  const name = t.getName();
  const { ok, doc, reason } = requireDoc(t);
  if (!ok) return push(sf, t, "type", name, reason!);

  const tags = doc!.getTags();
  const propTags = tags.filter((tg) => tg.getTagName() === "property");
  const remarksTags = tags.filter((tg) => tg.getTagName() === "remarks");
  const rawSummary = normalizeComment(doc!.getComment());
  const hasVariantsInBody = /(^|\n)\s*Variants:\s*\n- /.test(rawSummary);
  const isConditional = looksConditionalAliasText(t);

  // 1) If object-like alias documented by @property lines, that's sufficient.
  if (propTags.length > 0) {
    // (Optionally validate each @property line format like in interfaces, but not required.)
    return;
  }

  // 2) If there's a remarks tag, accept either "Type: ..." or "Variants: ..."
  if (remarksTags.length > 0) {
    const r = tagText(remarksTags[0]).trim();
    if (/^Variants:\s*/.test(r)) {
      // Accept; optionally you could validate bullets exist.
      return;
    }
    if (!/^Type:\s+/.test(r)) {
      push(sf, t, "type", name, "@remarks should start with 'Type: ' or 'Variants:'");
      return;
    }
    if (/TODO\b/i.test(r)) push(sf, t, "type", name, "@remarks contains TODO");
    if (r.length > MAX_REMARKS_LEN)
      push(sf, t, "type", name, `@remarks too long (> ${MAX_REMARKS_LEN})`);
    const type = r.replace(/^Type:\s+/i, "").trim();
    const err = validateTypeSnippet(type);
    if (err) push(sf, t, "type", name, `@remarks type: ${err} [${type}]`);
    if (/^ReadonlyArray$/.test(type))
      push(sf, t, "type", name, "@remarks type missing element (e.g. ReadonlyArray<string>)");
    return;
  }

  // 3) No remarks tag. If the body contains a "Variants:" block, accept.
  if (hasVariantsInBody) return;

  // 4) Conditional helpers may omit remarks (generator avoids noisy output).
  if (isConditional) return;

  // Otherwise we expect a concise @remarks Type: ...
  push(sf, t, "type", name, "expect either @remarks 'Type: …' or 'Variants:' block");
}

function checkEnum(sf: SourceFile, e: EnumDeclaration) {
  const name = e.getName();
  const { ok, doc, reason } = requireDoc(e);
  if (!ok) return push(sf, e, "enum", name, reason!);

  // Optional: ensure a Members: bullet list exists
  const hasMembers = doc!
    .getTags()
    .some((t) => t.getTagName() === "remarks" && /Members:\s*\n- /.test(tagText(t)));
  if (!hasMembers) {
    // Not failing hard; comment the expectation
    // push(sf, e, "enum", name, "expect remarks listing Members: - A …");
  }
}

// ---- Main ------------------------------------------------------------------

const project = new Project({
  tsConfigFilePath: path.join(ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});

for (const sf of project.getSourceFiles(["src/**/*.ts"])) {
  const abs = sf.getFilePath();
  if (isIgnored(abs) || isSchemaFile(abs)) continue;

  // Functions (decl + exported const arrow)
  sf.getFunctions().forEach((fn) => {
    if (fn.isExported()) checkFunction(sf, fn, fn.getName() ?? "default");
  });
  sf.getVariableStatements().forEach((vs) => {
    if (!vs.isExported()) return;
    vs.getDeclarations().forEach((vd) => {
      const init = vd.getInitializer();
      if (init && Node.isArrowFunction(init)) {
        checkFunction(sf, init, vd.getName());
      } else {
        checkConst(sf, vd);
      }
    });
  });

  // Types / interfaces / enums
  sf.getTypeAliases().forEach((t) => t.isExported() && checkTypeAlias(sf, t));
  sf.getInterfaces().forEach((i) => i.isExported() && checkInterface(sf, i));
  sf.getEnums().forEach((e) => e.isExported() && checkEnum(sf, e));
}

// ---- Output / Exit ---------------------------------------------------------

if (problems.length) {
  console.error("❌ TSDoc style violations:");
  for (const v of problems) {
    console.error(` - ${v.file}:${v.line} :: ${v.kind} ${v.name} — ${v.msg}`);
  }
  process.exit(1);
}
console.log("✅ All exported declarations conform to TSDoc house style.");
