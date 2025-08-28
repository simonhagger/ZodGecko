import { readFileSync } from "node:fs";
import path from "node:path";

const endpointsTs = readFileSync("src/runtime/endpoints.ts", "utf8");
const paths = [...endpointsTs.matchAll(/"(\/[^"]+)"\s*:\s*\{/g)].map((m) => m[1]).sort();

const docsMd = readFileSync("docs/endpoints.md", "utf8"); // adjust if different
const listed = [...docsMd.matchAll(/^\s*-\s*`([^`]+)`/gm)].map((m) => m[1]).sort();

const onlyInCode = paths.filter((p) => !listed.includes(p));
const onlyInDocs = listed.filter((p) => !paths.includes(p));

if (onlyInCode.length || onlyInDocs.length) {
  console.error("❌ Endpoint list drift detected.");
  if (onlyInCode.length) console.error("Missing in docs:\n" + onlyInCode.join("\n"));
  if (onlyInDocs.length) console.error("Missing in code:\n" + onlyInDocs.join("\n"));
  process.exit(1);
}
console.log("✅ Endpoint list matches docs");
