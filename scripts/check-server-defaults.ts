import { readFileSync } from "node:fs";
const code = readFileSync("src/runtime/server-defaults.ts", "utf8");
const entries = [...code.matchAll(/serverDefaults\[("[^"]+")\]/g)].map((m) => m[1]);

const md = readFileSync("docs/server-defaults.md", "utf8");
const mdEntries = [...md.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((m) => `"${m[1]}"`);

const missingInMd = entries.filter((e) => !mdEntries.includes(e));
if (missingInMd.length) {
  console.error("❌ serverDefaults entries missing in docs:\n" + missingInMd.join("\n"));
  process.exit(1);
}
console.log("✅ serverDefaults table up to date");
