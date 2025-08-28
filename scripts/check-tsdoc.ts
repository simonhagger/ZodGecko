// scripts/check-tsdoc.ts
import {
  Project,
  VariableStatement,
  FunctionDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
  SyntaxKind,
  JSDoc,
} from "ts-morph";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const project = new Project({
  tsConfigFilePath: path.join(__dirname, "..", "tsconfig.json"),
});

const sourceFiles = project
  .getSourceFiles("src/**/*.ts")
  .filter((sf) => !/__tests__/.test(sf.getFilePath()));

let missing = 0;

function hasPublicDoc(docs: JSDoc[] | undefined): boolean {
  if (!docs || docs.length === 0) return false;
  // If any block is tagged @internal or @private, treat it as sufficiently documented
  for (const d of docs) {
    const tags = d.getTags();
    if (tags.some((t) => /^(internal|private)$/i.test(t.getTagName()))) {
      return true;
    }
  }
  return true;
}

function report(sfPath: string, line: number, name: string) {
  console.log(`${sfPath}:${line} Missing TSDoc for ${name}`);
  missing++;
}

// ---- Pass 1: Variable statements (exported const/let) ----
for (const sf of sourceFiles) {
  for (const vs of sf.getVariableStatements()) {
    // Only exported variable statements
    if (!vs.isExported()) continue;

    const docs = (vs as VariableStatement).getJsDocs();
    const documented = hasPublicDoc(docs);

    if (!documented) {
      const names = vs.getDeclarations().map((d) => d.getName());
      report(sf.getFilePath(), vs.getStartLineNumber(), names.join(", "));
    }
  }
}

// ---- Pass 2: Functions, classes, interfaces, type aliases, enums ----
for (const sf of sourceFiles) {
  // Functions
  for (const fn of sf.getFunctions()) {
    if (!(fn as FunctionDeclaration).isExported()) continue;
    if (!hasPublicDoc(fn.getJsDocs())) {
      report(sf.getFilePath(), fn.getStartLineNumber(), fn.getName() ?? "(anonymous function)");
    }
  }

  // Classes
  for (const cls of sf.getClasses()) {
    if (!(cls as ClassDeclaration).isExported()) continue;
    if (!hasPublicDoc(cls.getJsDocs())) {
      report(sf.getFilePath(), cls.getStartLineNumber(), cls.getName() ?? "(anonymous class)");
    }
  }

  // Interfaces
  for (const intf of sf.getInterfaces()) {
    if (!(intf as InterfaceDeclaration).isExported()) continue;
    if (!hasPublicDoc(intf.getJsDocs())) {
      report(sf.getFilePath(), intf.getStartLineNumber(), intf.getName());
    }
  }

  // Type aliases
  for (const ta of sf.getTypeAliases()) {
    if (!(ta as TypeAliasDeclaration).isExported()) continue;
    if (!hasPublicDoc(ta.getJsDocs())) {
      report(sf.getFilePath(), ta.getStartLineNumber(), ta.getName());
    }
  }

  // Enums
  for (const en of sf.getEnums()) {
    if (!(en as EnumDeclaration).isExported()) continue;
    if (!hasPublicDoc(en.getJsDocs())) {
      report(sf.getFilePath(), en.getStartLineNumber(), en.getName());
    }
  }
}

// ---- Summary / exit ----
if (missing) {
  console.error(`\n❌ Missing TSDoc on ${missing} exported declarations.`);
  process.exit(1);
}
console.log("✅ TSDoc coverage OK");
