// scripts/check-zod-version.mjs
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const version = pkg.dependencies?.zod || pkg.devDependencies?.zod || "";

if (!/^(\^)?4\./.test(version)) {
  console.error(`❌ zod major must be 4.x, found "${version}"`);
  process.exit(1);
}

console.log("✅ Zod v4 checks OK");
