import { Project, SyntaxKind } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const sourceFiles = project.getSourceFiles("src/**/*.ts");

let missing = 0;
for (const sf of sourceFiles) {
  for (const decl of [
    ...sf.getFunctions(),
    ...sf.getClasses(),
    ...sf.getInterfaces(),
    ...sf.getTypeAliases(),
    ...sf.getEnums(),
    ...sf.getVariableDeclarations(),
  ]) {
    // Only public surface: exported and NOT in test folders
    const isExported = decl
      .getFirstAncestorByKind(SyntaxKind.SourceFile)
      ?.getExportedDeclarations()
      .has(decl.getName?.() ?? "");
    const isTest = /__tests__/.test(sf.getFilePath());
    if (!isExported || isTest) continue;

    const docs = (decl as any).getJsDocs?.() ?? [];
    if (!docs.length) {
      console.log(
        `${sf.getFilePath()}:${decl.getStartLineNumber?.() ?? 0} Missing TSDoc for ${decl.getSymbol()?.getName()}`,
      );
      missing++;
    }
  }
}
if (missing) {
  console.error(`\n❌ Missing TSDoc on ${missing} exported declarations.`);
  process.exit(1);
}
console.log("✅ TSDoc coverage OK");
